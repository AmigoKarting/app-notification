-- =====================================================================
--  Ciblage par rôle : permet de choisir quels rôles reçoivent une notif
--  Colonne nullable : NULL = comportement existant (tout le monde sauf
--  caissières quand target_mode='all', cf. migration 0031).
--  Quand target_roles est renseigné, seuls les profils dont le rôle
--  figure dans la liste voient l'item.
-- =====================================================================

alter table public.feed_items
  add column if not exists target_roles text[] default null;

-- Mise à jour de la RLS pour prendre en compte target_roles
drop policy if exists feed_items_select on public.feed_items;
create policy feed_items_select on public.feed_items
for select to authenticated
using (
  created_by = auth.uid()
  or (
    is_draft = false
    and (
      public.is_dev()
      or (
        target_mode = 'all'
        and not public.is_caissiere()
        and target_roles is null
      )
      or (
        target_mode = 'all'
        and target_roles is not null
        and (select role::text from public.profiles where id = auth.uid()) = any(target_roles)
      )
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
