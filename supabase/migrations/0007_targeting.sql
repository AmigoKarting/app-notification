-- =====================================================================
--  Ciblage des notifications
--  - feed_items.target_mode: 'all' | 'teams' | 'users'
--  - teams + team_members (gestion d'équipes)
--  - feed_item_target_teams / feed_item_target_users (jonctions de ciblage)
--  - RLS conditionnelle sur feed_items: un employé ne voit l'item que si
--      target_mode='all'
--      OU il est dans la liste 'users'
--      OU il est dans une team listée
--
--  Bonus: dénormalisation de auth.users.email dans profiles.email pour
--  que le picker d'utilisateurs puisse afficher l'email sans admin client.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) profiles.email (pour les pickers admin)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text;

-- Backfill
update public.profiles p
   set email = u.email
  from auth.users u
 where p.id = u.id and p.email is null;

-- Trigger handle_new_user: maintenant copie aussi l'email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  no_dev_yet boolean;
begin
  select not exists (select 1 from public.profiles where role = 'dev')
  into no_dev_yet;

  insert into public.profiles (id, role, email)
  values (
    new.id,
    case when no_dev_yet then 'dev'::public.app_role else 'employee'::public.app_role end,
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Enum target_mode + colonne sur feed_items
-- ---------------------------------------------------------------------
do $$ begin
  create type public.feed_target_mode as enum ('all', 'teams', 'users');
exception when duplicate_object then null;
end $$;

alter table public.feed_items
  add column if not exists target_mode public.feed_target_mode not null default 'all';

create index if not exists feed_items_target_mode_idx
  on public.feed_items (target_mode);

-- ---------------------------------------------------------------------
-- 2) teams
-- ---------------------------------------------------------------------
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  slug       text not null,
  name       text not null check (length(trim(name)) > 0),
  color      text not null default '#6b7280',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create index if not exists teams_owner_idx on public.teams (owner_id);

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3) team_members
-- ---------------------------------------------------------------------
create table if not exists public.team_members (
  team_id  uuid not null references public.teams(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index if not exists team_members_user_idx on public.team_members (user_id);

-- ---------------------------------------------------------------------
-- 4) Jonctions de ciblage des feed_items
-- ---------------------------------------------------------------------
create table if not exists public.feed_item_target_teams (
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  team_id      uuid not null references public.teams(id) on delete cascade,
  primary key (feed_item_id, team_id)
);

create index if not exists feed_target_teams_team_idx
  on public.feed_item_target_teams (team_id);

create table if not exists public.feed_item_target_users (
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  primary key (feed_item_id, user_id)
);

create index if not exists feed_target_users_user_idx
  on public.feed_item_target_users (user_id);

-- =====================================================================
--  Row Level Security
-- =====================================================================
alter table public.teams                    enable row level security;
alter table public.team_members             enable row level security;
alter table public.feed_item_target_teams   enable row level security;
alter table public.feed_item_target_users   enable row level security;

-- ---------- teams ---------------------------------------------------
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
for select to authenticated using (true);

drop policy if exists teams_write_own on public.teams;
create policy teams_write_own on public.teams
for all to authenticated
using (public.is_dev() and owner_id = auth.uid())
with check (public.is_dev() and owner_id = auth.uid());

-- ---------- team_members --------------------------------------------
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
for select to authenticated
using (user_id = auth.uid() or public.is_dev());

drop policy if exists team_members_write_dev on public.team_members;
create policy team_members_write_dev on public.team_members
for all to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.teams t
    where t.id = team_id and t.owner_id = auth.uid()
  )
)
with check (
  public.is_dev() and exists (
    select 1 from public.teams t
    where t.id = team_id and t.owner_id = auth.uid()
  )
);

-- ---------- feed_item_target_teams ----------------------------------
drop policy if exists feed_target_teams_select on public.feed_item_target_teams;
create policy feed_target_teams_select on public.feed_item_target_teams
for select to authenticated using (true);

drop policy if exists feed_target_teams_write_dev on public.feed_item_target_teams;
create policy feed_target_teams_write_dev on public.feed_item_target_teams
for all to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.feed_items f
    where f.id = feed_item_id and f.created_by = auth.uid()
  )
)
with check (
  public.is_dev() and exists (
    select 1 from public.feed_items f
    where f.id = feed_item_id and f.created_by = auth.uid()
  )
);

-- ---------- feed_item_target_users ----------------------------------
drop policy if exists feed_target_users_select on public.feed_item_target_users;
create policy feed_target_users_select on public.feed_item_target_users
for select to authenticated
using (user_id = auth.uid() or public.is_dev());

drop policy if exists feed_target_users_write_dev on public.feed_item_target_users;
create policy feed_target_users_write_dev on public.feed_item_target_users
for all to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.feed_items f
    where f.id = feed_item_id and f.created_by = auth.uid()
  )
)
with check (
  public.is_dev() and exists (
    select 1 from public.feed_items f
    where f.id = feed_item_id and f.created_by = auth.uid()
  )
);

-- ---------- feed_items: SELECT conditionnel sur target -------------
-- Remplace l'ancienne policy 'tout authentifié peut tout lire' par une
-- policy qui respecte le ciblage.
drop policy if exists feed_items_select on public.feed_items;
create policy feed_items_select on public.feed_items
for select to authenticated
using (
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
);

-- =====================================================================
--  Grants
-- =====================================================================
grant select, insert, update, delete on public.teams                  to authenticated;
grant select, insert, update, delete on public.team_members           to authenticated;
grant select, insert, update, delete on public.feed_item_target_teams to authenticated;
grant select, insert, update, delete on public.feed_item_target_users to authenticated;
