-- =====================================================================
--  Configuration enrichie des notifications
--    - is_draft   : sauvegarder sans publier (caché des autres users)
--    - is_pinned  : épingler en haut du fil
--    - image_url  : illustration associée
--    - send_channels: canaux d'envoi externe (email, sms...) en plus du fil
--  + bucket Storage public 'notifications' pour les images uploadées
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Nouvelles colonnes sur feed_items
-- ---------------------------------------------------------------------
alter table public.feed_items
  add column if not exists is_draft       boolean not null default false,
  add column if not exists is_pinned      boolean not null default false,
  add column if not exists image_url      text,
  add column if not exists send_channels  text[] not null default '{}';

-- Index dédié au tri "pinned first" qui est l'ordre par défaut du fil
create index if not exists feed_items_pinned_published_idx
  on public.feed_items (is_pinned desc, published_at desc);

-- ---------------------------------------------------------------------
-- 2) RLS: brouillons cachés des autres utilisateurs
--    Le créateur voit toujours ses items (y compris is_draft=true).
--    Les autres ne voient les items que si is_draft=false ET le ciblage
--    s'applique à eux.
-- ---------------------------------------------------------------------
drop policy if exists feed_items_select on public.feed_items;
create policy feed_items_select on public.feed_items
for select to authenticated
using (
  -- 1. Le créateur voit toujours ses items, brouillons compris.
  created_by = auth.uid()
  or (
    -- 2. Pour les autres, le brouillon est caché.
    is_draft = false
    and (
      public.is_dev()
      or target_mode = 'all'
      or (
        target_mode = 'users' and exists (
          select 1 from public.feed_item_target_users tu
          where tu.feed_item_id = id and tu.user_id = auth.uid()
        )
      )
      or (
        target_mode = 'teams' and exists (
          select 1
          from public.feed_item_target_teams tt
          join public.team_members tm on tm.team_id = tt.team_id
          where tt.feed_item_id = id and tm.user_id = auth.uid()
        )
      )
    )
  )
);

-- ---------------------------------------------------------------------
-- 3) Bucket Storage 'notifications' pour les images de notif
--    Public en lecture, écriture réservée aux devs.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('notifications', 'notifications', true)
on conflict (id) do nothing;

drop policy if exists "notifications public read" on storage.objects;
create policy "notifications public read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'notifications');

drop policy if exists "notifications upload by dev" on storage.objects;
create policy "notifications upload by dev" on storage.objects
for insert to authenticated
with check (bucket_id = 'notifications' and public.is_dev());

drop policy if exists "notifications update by dev" on storage.objects;
create policy "notifications update by dev" on storage.objects
for update to authenticated
using (bucket_id = 'notifications' and public.is_dev())
with check (bucket_id = 'notifications' and public.is_dev());

drop policy if exists "notifications delete by dev" on storage.objects;
create policy "notifications delete by dev" on storage.objects
for delete to authenticated
using (bucket_id = 'notifications' and public.is_dev());
