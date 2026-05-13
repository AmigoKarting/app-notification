-- =====================================================================
--  App Notification — Schéma initial
--  Tables  : employees, reminders
--  Auth    : Supabase Auth (auth.users) — chaque ligne appartient à un user
--  Sécurité: Row Level Security activée + policies par utilisateur
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Enum: statut d'un rappel
-- ---------------------------------------------------------------------
do $$ begin
  create type public.reminder_status as enum ('pending', 'sent', 'cancelled', 'failed');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- Trigger générique: updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
--  Table: employees
-- =====================================================================
create table if not exists public.employees (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  email       text not null check (position('@' in email) > 1),
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Un même utilisateur ne peut pas enregistrer 2 employés avec le même email
  constraint employees_user_email_unique unique (user_id, email)
);

-- Index pour les listes/filtrages côté dashboard
create index if not exists employees_user_id_idx
  on public.employees (user_id);

create index if not exists employees_user_name_idx
  on public.employees (user_id, name);

-- Trigger updated_at
drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

-- =====================================================================
--  Table: reminders
-- =====================================================================
create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  employee_id   uuid not null references public.employees(id) on delete cascade,
  message       text not null check (length(trim(message)) > 0),
  scheduled_at  timestamptz not null,
  status        public.reminder_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index dédiés aux requêtes les plus fréquentes
create index if not exists reminders_user_scheduled_idx
  on public.reminders (user_id, scheduled_at);

create index if not exists reminders_employee_idx
  on public.reminders (employee_id);

create index if not exists reminders_user_status_idx
  on public.reminders (user_id, status);

-- Index partiel: scan rapide des rappels à envoyer (worker / cron)
create index if not exists reminders_pending_due_idx
  on public.reminders (scheduled_at)
  where status = 'pending';

-- Trigger updated_at
drop trigger if exists trg_reminders_updated_at on public.reminders;
create trigger trg_reminders_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

-- =====================================================================
--  Row Level Security
--  Règle: l'utilisateur authentifié ne voit/modifie QUE ses propres lignes.
-- =====================================================================
alter table public.employees enable row level security;
alter table public.reminders enable row level security;

-- ---------- employees -----------------------------------------------
drop policy if exists "employees_select_own" on public.employees;
create policy "employees_select_own"
on public.employees
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "employees_insert_own" on public.employees;
create policy "employees_insert_own"
on public.employees
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "employees_update_own" on public.employees;
create policy "employees_update_own"
on public.employees
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "employees_delete_own" on public.employees;
create policy "employees_delete_own"
on public.employees
for delete
to authenticated
using (auth.uid() = user_id);

-- ---------- reminders -----------------------------------------------
drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
on public.reminders
for select
to authenticated
using (auth.uid() = user_id);

-- À l'insertion: vérifie aussi que l'employé visé appartient à l'utilisateur
drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own"
on public.reminders
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.employees e
    where e.id = employee_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own"
on public.reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own"
on public.reminders
for delete
to authenticated
using (auth.uid() = user_id);

-- =====================================================================
--  Privilèges (Supabase): on n'expose ces tables qu'aux rôles attendus.
--  La RLS reste la garde principale — ces grants permettent à PostgREST
--  d'y accéder, mais chaque requête est ensuite filtrée par les policies.
-- =====================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;

-- (Optionnel) anon n'a aucun accès aux données métier
revoke all on public.employees from anon;
revoke all on public.reminders from anon;
