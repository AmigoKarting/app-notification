-- =====================================================================
--  Exclure les caissières du feed de notifications
--  Les caissières n'ont besoin que de la checklist, pas du feed
--  superviseur/admin.
-- =====================================================================

-- 1) Helper is_caissiere() ─ miroir de is_dev()
create or replace function public.is_caissiere()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'caissiere'
  );
$$;

revoke all on function public.is_caissiere() from public;
grant execute on function public.is_caissiere() to authenticated;

-- 2) RLS : les caissières ne voient plus target_mode='all'
--    Elles ne voient que les items ciblés explicitement (teams/users)
--    ou ceux qu'elles ont créés elles-mêmes.
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
        target_mode = 'all' and not public.is_caissiere()
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
