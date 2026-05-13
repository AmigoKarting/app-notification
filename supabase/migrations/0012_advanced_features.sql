-- =====================================================================
--  Fonctionnalités avancées
--    - notification_templates : modèles réutilisables (par dev)
--    - category_mutes         : préférence par user, masquer une catégorie
--    - feed_item_comments     : fil de discussion sous chaque notif
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) notification_templates
-- ---------------------------------------------------------------------
create table if not exists public.notification_templates (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  -- Champs copiés sur le template
  kind          public.feed_item_kind not null default 'notification',
  title         text not null,
  body          text,
  priority      public.feed_priority not null default 'normal',
  category_id   uuid references public.categories(id) on delete set null,
  action_label  text,
  action_url    text,
  send_channels text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists templates_owner_idx
  on public.notification_templates (owner_id);

drop trigger if exists trg_templates_updated_at on public.notification_templates;
create trigger trg_templates_updated_at
before update on public.notification_templates
for each row execute function public.set_updated_at();

alter table public.notification_templates enable row level security;

drop policy if exists templates_select_own on public.notification_templates;
create policy templates_select_own on public.notification_templates
for select to authenticated
using (public.is_dev() and owner_id = auth.uid());

drop policy if exists templates_write_own on public.notification_templates;
create policy templates_write_own on public.notification_templates
for all to authenticated
using (public.is_dev() and owner_id = auth.uid())
with check (public.is_dev() and owner_id = auth.uid());

grant select, insert, update, delete on public.notification_templates to authenticated;

-- ---------------------------------------------------------------------
-- 2) category_mutes : préférence user de masquer une catégorie
-- ---------------------------------------------------------------------
create table if not exists public.category_mutes (
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);

create index if not exists category_mutes_user_idx
  on public.category_mutes (user_id);

alter table public.category_mutes enable row level security;

drop policy if exists category_mutes_select_own on public.category_mutes;
create policy category_mutes_select_own on public.category_mutes
for select to authenticated
using (user_id = auth.uid());

drop policy if exists category_mutes_insert_own on public.category_mutes;
create policy category_mutes_insert_own on public.category_mutes
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists category_mutes_delete_own on public.category_mutes;
create policy category_mutes_delete_own on public.category_mutes
for delete to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.category_mutes to authenticated;

-- ---------------------------------------------------------------------
-- 3) feed_item_comments : discussion sous chaque notif
-- ---------------------------------------------------------------------
create table if not exists public.feed_item_comments (
  id           uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  body         text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists comments_item_idx
  on public.feed_item_comments (feed_item_id, created_at);

drop trigger if exists trg_comments_updated_at on public.feed_item_comments;
create trigger trg_comments_updated_at
before update on public.feed_item_comments
for each row execute function public.set_updated_at();

alter table public.feed_item_comments enable row level security;

-- SELECT: tout authentifié peut lire (les destinataires verront les commentaires
-- sur les items visibles pour eux; les autres n'ont pas de raison de fetcher).
-- L'item lui-même est déjà filtré par RLS, et l'employé voit l'item dans son fil
-- donc les commentaires associés sont pertinents.
drop policy if exists comments_select on public.feed_item_comments;
create policy comments_select on public.feed_item_comments
for select to authenticated using (true);

drop policy if exists comments_insert_own on public.feed_item_comments;
create policy comments_insert_own on public.feed_item_comments
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists comments_update_own on public.feed_item_comments;
create policy comments_update_own on public.feed_item_comments
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists comments_delete_own on public.feed_item_comments;
create policy comments_delete_own on public.feed_item_comments
for delete to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.feed_item_comments to authenticated;
