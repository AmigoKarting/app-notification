-- =====================================================================
--  Engagement sur les notifications
--    - feed_items.action_label / action_url : bouton CTA cliquable
--    - feed_item_reads          : qui a lu quoi, quand
--    - feed_item_reactions      : réactions emoji par user
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) CTA (bouton d'action) sur feed_items
-- ---------------------------------------------------------------------
alter table public.feed_items
  add column if not exists action_label text,
  add column if not exists action_url   text,
  -- Garantir cohérence: les deux ou aucun.
  add constraint feed_items_action_pair check (
    (action_label is null and action_url is null)
    or (action_label is not null and action_url is not null)
  );

-- ---------------------------------------------------------------------
-- 2) feed_item_reads
-- ---------------------------------------------------------------------
create table if not exists public.feed_item_reads (
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  read_at      timestamptz not null default now(),
  primary key (feed_item_id, user_id)
);

create index if not exists feed_item_reads_user_idx
  on public.feed_item_reads (user_id, read_at desc);

create index if not exists feed_item_reads_item_idx
  on public.feed_item_reads (feed_item_id);

alter table public.feed_item_reads enable row level security;

-- SELECT: l'utilisateur voit ses propres lectures; le dev voit toutes
drop policy if exists feed_item_reads_select on public.feed_item_reads;
create policy feed_item_reads_select on public.feed_item_reads
for select to authenticated
using (user_id = auth.uid() or public.is_dev());

-- INSERT/DELETE: chacun gère sa propre lecture
drop policy if exists feed_item_reads_insert_own on public.feed_item_reads;
create policy feed_item_reads_insert_own on public.feed_item_reads
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists feed_item_reads_delete_own on public.feed_item_reads;
create policy feed_item_reads_delete_own on public.feed_item_reads
for delete to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.feed_item_reads to authenticated;

-- ---------------------------------------------------------------------
-- 3) feed_item_reactions
-- ---------------------------------------------------------------------
create table if not exists public.feed_item_reactions (
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  emoji        text not null check (length(emoji) between 1 and 8),
  created_at   timestamptz not null default now(),
  primary key (feed_item_id, user_id, emoji)
);

create index if not exists feed_item_reactions_item_idx
  on public.feed_item_reactions (feed_item_id);

alter table public.feed_item_reactions enable row level security;

-- SELECT: visible à tout authentifié (compteurs publics par item)
drop policy if exists feed_item_reactions_select on public.feed_item_reactions;
create policy feed_item_reactions_select on public.feed_item_reactions
for select to authenticated using (true);

-- INSERT/DELETE: chacun gère ses propres réactions
drop policy if exists feed_item_reactions_insert_own on public.feed_item_reactions;
create policy feed_item_reactions_insert_own on public.feed_item_reactions
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists feed_item_reactions_delete_own on public.feed_item_reactions;
create policy feed_item_reactions_delete_own on public.feed_item_reactions
for delete to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.feed_item_reactions to authenticated;
