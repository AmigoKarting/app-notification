-- =====================================================================
--  Planifications récurrentes
--    - notification_schedules: la "recette" (titre, body, target, récurrence)
--    - schedule_target_teams / schedule_target_users: ciblage
--    - schedule_runs: historique anti-doublon (PK composite (id, run_at))
--
--  Idée: à chaque tick, le worker
--    1) charge les schedules dues (next_run_at <= now AND is_active)
--    2) INSERT INTO schedule_runs ON CONFLICT DO NOTHING (anti-doublon)
--    3) si l'insert a réussi: crée un feed_item miroir du schedule
--    4) met à jour last_run_at → trigger recalcule next_run_at
--
--  La fonction compute_next_run() vit en SQL pour garder la logique
--  fuseau-aware côté DB (Postgres gère TZ + DST proprement).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Table notification_schedules
-- ---------------------------------------------------------------------
create table if not exists public.notification_schedules (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,

  -- Contenu (miroir des champs feed_items)
  title         text not null check (length(trim(title)) > 0),
  body          text,
  kind          public.feed_item_kind not null default 'notification',
  category_id   uuid references public.categories(id) on delete set null,
  session_id    uuid references public.sessions(id) on delete set null,
  priority      public.feed_priority not null default 'normal',

  -- Récurrence
  timezone      text not null default 'Europe/Paris',
  times         text[] not null,                 -- ['08:00','14:30']
  days_of_week  smallint[] not null,             -- [1..7] ISO (1=Mon)

  -- Ciblage (miroir feed_items)
  target_mode   public.feed_target_mode not null default 'all',

  -- État
  is_active     boolean not null default true,
  last_run_at   timestamptz,
  next_run_at   timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint schedules_times_nonempty check (array_length(times, 1) >= 1),
  constraint schedules_dow_nonempty   check (array_length(days_of_week, 1) >= 1),
  -- days_of_week ⊆ {1..7} : opérateur "array contenu dans" (sans subquery)
  constraint schedules_dow_range
    check (days_of_week <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[])
);

-- Validation du format des heures (HH:MM) : déléguée à Zod côté
-- application (createScheduleSchema). Postgres n'autorise pas les
-- sous-requêtes dans les CHECK constraints, donc on évite ce check
-- au niveau DB pour ne pas complexifier le schéma. Une future migration
-- pourrait ajouter une IMMUTABLE function si besoin d'un garde-fou DB.

create index if not exists schedules_due_idx
  on public.notification_schedules (next_run_at)
  where is_active = true;

create index if not exists schedules_owner_idx
  on public.notification_schedules (owner_id);

drop trigger if exists trg_schedules_updated_at on public.notification_schedules;
create trigger trg_schedules_updated_at
before update on public.notification_schedules
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2) compute_next_run()
--    Calcule la prochaine occurrence > p_after dans le fuseau donné.
-- ---------------------------------------------------------------------
create or replace function public.compute_next_run(
  p_timezone     text,
  p_times        text[],
  p_days_of_week smallint[],
  p_after        timestamptz default now()
) returns timestamptz
language plpgsql
stable
as $$
declare
  next_run timestamptz := null;
  candidate timestamptz;
  t text;
  i int;
  local_date date;
  local_time time;
  weekday int;
begin
  -- Itère sur les 8 prochains jours (cas DST + jour courant)
  for i in 0..7 loop
    local_date := ((p_after at time zone p_timezone)::date) + i;
    weekday := extract(isodow from local_date)::int;  -- 1=Mon..7=Sun
    if not (weekday = any(p_days_of_week)) then
      continue;
    end if;
    foreach t in array p_times loop
      local_time := t::time;
      candidate := (local_date + local_time) at time zone p_timezone;
      if candidate > p_after and (next_run is null or candidate < next_run) then
        next_run := candidate;
      end if;
    end loop;
    -- Premier jour matching dans le futur trouvé → c'est le bon
    if next_run is not null then
      exit;
    end if;
  end loop;
  return next_run;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Trigger: maintient next_run_at à jour
--    Se déclenche sur les colonnes qui influencent le calcul.
--    Important: NE PAS inclure next_run_at dans les colonnes watched
--    (sinon récursion).
-- ---------------------------------------------------------------------
create or replace function public.set_schedule_next_run()
returns trigger
language plpgsql
as $$
begin
  if new.is_active then
    new.next_run_at := public.compute_next_run(
      new.timezone,
      new.times,
      new.days_of_week,
      coalesce(new.last_run_at, now())
    );
  else
    new.next_run_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_schedules_set_next_run on public.notification_schedules;
create trigger trg_schedules_set_next_run
before insert or update of
  timezone, times, days_of_week, is_active, last_run_at
on public.notification_schedules
for each row execute function public.set_schedule_next_run();

-- ---------------------------------------------------------------------
-- 4) Junctions de ciblage
-- ---------------------------------------------------------------------
create table if not exists public.schedule_target_teams (
  schedule_id uuid not null references public.notification_schedules(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  primary key (schedule_id, team_id)
);

create index if not exists schedule_target_teams_team_idx
  on public.schedule_target_teams (team_id);

create table if not exists public.schedule_target_users (
  schedule_id uuid not null references public.notification_schedules(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  primary key (schedule_id, user_id)
);

create index if not exists schedule_target_users_user_idx
  on public.schedule_target_users (user_id);

-- ---------------------------------------------------------------------
-- 5) schedule_runs (historique anti-doublon)
--    PK composite (schedule_id, run_at) garantit qu'une même
--    occurrence ne peut JAMAIS être créée deux fois, même si deux
--    workers tournent en parallèle.
-- ---------------------------------------------------------------------
create table if not exists public.schedule_runs (
  schedule_id   uuid not null references public.notification_schedules(id) on delete cascade,
  run_at        timestamptz not null,
  feed_item_id  uuid references public.feed_items(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (schedule_id, run_at)
);

create index if not exists schedule_runs_created_idx
  on public.schedule_runs (created_at desc);

-- =====================================================================
--  RLS
-- =====================================================================
alter table public.notification_schedules enable row level security;
alter table public.schedule_target_teams  enable row level security;
alter table public.schedule_target_users  enable row level security;
alter table public.schedule_runs          enable row level security;

-- Notification_schedules: dev lit/écrit ses propres schedules
drop policy if exists schedules_select_own on public.notification_schedules;
create policy schedules_select_own on public.notification_schedules
for select to authenticated
using (public.is_dev() and owner_id = auth.uid());

drop policy if exists schedules_write_own on public.notification_schedules;
create policy schedules_write_own on public.notification_schedules
for all to authenticated
using (public.is_dev() and owner_id = auth.uid())
with check (public.is_dev() and owner_id = auth.uid());

-- Schedule junctions
drop policy if exists schedule_target_teams_select on public.schedule_target_teams;
create policy schedule_target_teams_select on public.schedule_target_teams
for select to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
);

drop policy if exists schedule_target_teams_write on public.schedule_target_teams;
create policy schedule_target_teams_write on public.schedule_target_teams
for all to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
)
with check (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
);

drop policy if exists schedule_target_users_select on public.schedule_target_users;
create policy schedule_target_users_select on public.schedule_target_users
for select to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
);

drop policy if exists schedule_target_users_write on public.schedule_target_users;
create policy schedule_target_users_write on public.schedule_target_users
for all to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
)
with check (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
);

-- schedule_runs: lecture par owner du schedule, écriture jamais (worker via service-role)
drop policy if exists schedule_runs_select_own on public.schedule_runs;
create policy schedule_runs_select_own on public.schedule_runs
for select to authenticated
using (
  public.is_dev() and exists (
    select 1 from public.notification_schedules s
    where s.id = schedule_id and s.owner_id = auth.uid()
  )
);

-- =====================================================================
--  Grants
-- =====================================================================
grant select, insert, update, delete on public.notification_schedules to authenticated;
grant select, insert, update, delete on public.schedule_target_teams to authenticated;
grant select, insert, update, delete on public.schedule_target_users to authenticated;
grant select on public.schedule_runs to authenticated;
