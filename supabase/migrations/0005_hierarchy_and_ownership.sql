-- =====================================================================
--  Per-dev ownership + hiérarchie Category → Session → Notification
--  + statut sur feed_items
--
--  Décisions:
--   - Ownership: chaque dev a SES propres categories/sessions/feed_items.
--     Les autres devs ne peuvent PAS les modifier (ils peuvent toujours
--     les lire pour rendre le feed côté employé).
--   - Les seeds existants de la table categories restent avec owner_id NULL
--     (= "système", non éditables). Pour leur donner un propriétaire:
--       update categories set owner_id = '<uuid-dev>' where owner_id is null;
-- =====================================================================

-- ---------------------------------------------------------------------
-- categories: ajout owner_id + RLS scopée
-- ---------------------------------------------------------------------
alter table public.categories
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists categories_owner_idx on public.categories (owner_id);

-- L'ancienne policy "categories_write_dev" autorisait n'importe quel dev
-- à modifier n'importe quelle catégorie. On la remplace par une policy
-- scopée à l'owner.
drop policy if exists categories_write_dev on public.categories;
drop policy if exists categories_write_own on public.categories;
create policy categories_write_own on public.categories
for all to authenticated
using (public.is_dev() and owner_id = auth.uid())
with check (public.is_dev() and owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- sessions: ajout owner_id + category_id + RLS scopée
-- ---------------------------------------------------------------------
alter table public.sessions
  add column if not exists owner_id    uuid references auth.users(id) on delete cascade,
  add column if not exists category_id uuid references public.categories(id) on delete cascade;

create index if not exists sessions_owner_idx     on public.sessions (owner_id);
create index if not exists sessions_category_idx  on public.sessions (category_id);

drop policy if exists sessions_write_dev on public.sessions;
drop policy if exists sessions_write_own on public.sessions;
create policy sessions_write_own on public.sessions
for all to authenticated
using (public.is_dev() and owner_id = auth.uid())
with check (public.is_dev() and owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- feed_items: status + RLS write resserrée à l'owner (created_by)
-- ---------------------------------------------------------------------
do $$ begin
  create type public.feed_item_status as enum ('pending', 'sent', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

alter table public.feed_items
  add column if not exists status public.feed_item_status not null default 'pending';

create index if not exists feed_items_status_idx on public.feed_items (status);

-- Avant: tout dev pouvait éditer n'importe quel feed_item du moment
-- qu'il était le créateur du nouveau (with check). Maintenant on resserre
-- aussi le using → un dev ne touche QUE ce qu'il a créé.
drop policy if exists feed_items_write_dev on public.feed_items;
drop policy if exists feed_items_write_own on public.feed_items;
create policy feed_items_write_own on public.feed_items
for all to authenticated
using (public.is_dev() and created_by = auth.uid())
with check (public.is_dev() and created_by = auth.uid());
