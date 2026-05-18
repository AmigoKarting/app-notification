-- =====================================================================
--  Fix infinite recursion in feed_items RLS policies
--
--  Problem: feed_items SELECT policy checks feed_item_target_teams
--  and feed_item_target_users. The WRITE policies on those tables
--  check back into feed_items → infinite loop.
--
--  Fix: simplify write policies on target tables to just check
--  is_dev() without querying feed_items. Ownership is enforced
--  at the application level.
-- =====================================================================

-- Fix feed_item_target_teams write policy
drop policy if exists feed_target_teams_write_dev on public.feed_item_target_teams;
create policy feed_target_teams_write_dev on public.feed_item_target_teams
for all to authenticated
using (public.is_dev())
with check (public.is_dev());

-- Fix feed_item_target_users write policy
drop policy if exists feed_target_users_write_dev on public.feed_item_target_users;
create policy feed_target_users_write_dev on public.feed_item_target_users
for all to authenticated
using (public.is_dev())
with check (public.is_dev());
