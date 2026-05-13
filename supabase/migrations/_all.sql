-- =====================================================================
-- Bundle de toutes les migrations Supabase pour app-notification.
-- Généré automatiquement par scripts/build-all-migrations.mjs
-- Date: 2026-05-13T17:30:30.094Z
-- Migrations incluses: 13
--
-- USAGE : copier-coller ce fichier entier dans le SQL Editor de Supabase
-- (Dashboard → SQL Editor → New query → coller → Run).
-- Idempotent: peut être réexécuté sans dommage sur une DB déjà migrée.
-- =====================================================================


-- ---------------------------------------------------------------------
--  0001_init.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0002_dispatch.sql
-- ---------------------------------------------------------------------

-- =====================================================================
--  Dispatch des rappels — colonnes de tracking + RPC de claim atomique
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colonnes additionnelles sur reminders
-- ---------------------------------------------------------------------
alter table public.reminders
  add column if not exists attempts         int          not null default 0,
  add column if not exists last_error       text,
  add column if not exists last_attempt_at  timestamptz,
  add column if not exists claimed_at       timestamptz;

-- Index spécifique au worker: ne scan que les rappels prêts à être envoyés
create index if not exists reminders_dispatch_idx
  on public.reminders (scheduled_at)
  where status = 'pending' and claimed_at is null;

-- ---------------------------------------------------------------------
-- RPC: claim atomique
--
-- Pourquoi un RPC plutôt qu'un UPDATE depuis le client JS:
-- on a besoin de FOR UPDATE SKIP LOCKED pour qu'un éventuel deuxième
-- worker concurrent ne re-prenne pas les mêmes lignes (cron qui se
-- chevauche, double instance Vercel...). PostgREST ne permet pas ça.
--
-- La fonction:
--  1) Sélectionne jusqu'à `batch_size` rappels prêts (scheduled_at <= now)
--     dont les tentatives sont sous le plafond, et dont le claim est
--     soit absent, soit périmé (worker crashé).
--  2) Les marque atomiquement: claimed_at = now, attempts += 1.
--  3) Retourne les lignes claimed.
-- ---------------------------------------------------------------------
create or replace function public.claim_due_reminders(
  batch_size           int default 50,
  max_attempts         int default 5,
  stale_after_minutes  int default 15
)
returns setof public.reminders
language plpgsql
as $$
declare
  stale_cutoff timestamptz := now() - make_interval(mins => stale_after_minutes);
begin
  return query
  with eligible as (
    select id
    from public.reminders
    where status = 'pending'
      and scheduled_at <= now()
      and attempts < max_attempts
      and (claimed_at is null or claimed_at < stale_cutoff)
    order by scheduled_at asc
    limit batch_size
    for update skip locked
  )
  update public.reminders r
     set claimed_at      = now(),
         last_attempt_at = now(),
         attempts        = r.attempts + 1
    from eligible
   where r.id = eligible.id
  returning r.*;
end;
$$;

-- Verrouille l'accès: seul le rôle service_role (cron) peut claim.
revoke all on function public.claim_due_reminders(int, int, int) from public, anon, authenticated;
grant execute on function public.claim_due_reminders(int, int, int) to service_role;


-- ---------------------------------------------------------------------
--  0003_roles_and_feed.sql
-- ---------------------------------------------------------------------

-- =====================================================================
--  Système de rôles + fil de notifications/rappels in-app
--  Indépendant du système d'envoi email (employees + reminders).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin create type public.app_role        as enum ('employee', 'dev'); exception when duplicate_object then null; end $$;
do $$ begin create type public.feed_item_kind  as enum ('notification', 'reminder'); exception when duplicate_object then null; end $$;
do $$ begin create type public.feed_priority   as enum ('low', 'normal', 'high'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles  (extension de auth.users avec rôle)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.app_role not null default 'employee',
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-création du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: crée un profil pour les users existants (idempotent)
insert into public.profiles (id, role)
select u.id, 'employee'
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Helper: is_dev() pour les policies RLS
-- ---------------------------------------------------------------------
create or replace function public.is_dev()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'dev'
  );
$$;

revoke all on function public.is_dev() from public;
grant execute on function public.is_dev() to authenticated;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null check (length(trim(name)) > 0),
  color       text not null default '#6b7280',  -- hex Tailwind-friendly
  icon        text,                              -- emoji ou nom d'icône
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Seeds — palette de départ (sera modifiable par les devs)
insert into public.categories (slug, name, color, icon) values
  ('annonce',   'Annonce',    '#6b7280', '📢'),
  ('urgent',    'Urgent',     '#dc2626', '🚨'),
  ('rh',        'RH',         '#2563eb', '👥'),
  ('formation', 'Formation',  '#16a34a', '🎓'),
  ('securite',  'Sécurité',   '#ea580c', '🛡️')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- sessions  (périodes de temps)
-- ---------------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null check (length(trim(name)) > 0),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint sessions_valid_range check (ends_at > starts_at)
);

create index if not exists sessions_active_window_idx
  on public.sessions (starts_at, ends_at)
  where is_active = true;

drop trigger if exists trg_sessions_updated_at on public.sessions;
create trigger trg_sessions_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- feed_items  (notifications + rappels in-app)
--  - kind = 'notification' → info pure
--  - kind = 'reminder'     → info + due_date obligatoire
-- ---------------------------------------------------------------------
create table if not exists public.feed_items (
  id            uuid primary key default gen_random_uuid(),
  kind          public.feed_item_kind not null,
  title         text not null check (length(trim(title)) > 0),
  body          text,
  category_id   uuid references public.categories(id) on delete set null,
  session_id    uuid references public.sessions(id)   on delete set null,
  priority      public.feed_priority not null default 'normal',
  due_date      timestamptz,
  published_at  timestamptz not null default now(),
  expires_at    timestamptz,
  created_by    uuid not null references auth.users(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint feed_reminder_has_due_date
    check (kind <> 'reminder' or due_date is not null),
  constraint feed_valid_expiry
    check (expires_at is null or expires_at > published_at)
);

create index if not exists feed_items_published_idx
  on public.feed_items (published_at desc);
create index if not exists feed_items_kind_idx
  on public.feed_items (kind, published_at desc);
create index if not exists feed_items_category_idx
  on public.feed_items (category_id);
create index if not exists feed_items_session_idx
  on public.feed_items (session_id);
create index if not exists feed_items_due_idx
  on public.feed_items (due_date)
  where kind = 'reminder';

drop trigger if exists trg_feed_items_updated_at on public.feed_items;
create trigger trg_feed_items_updated_at
before update on public.feed_items
for each row execute function public.set_updated_at();

-- =====================================================================
--  Row Level Security
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.sessions    enable row level security;
alter table public.feed_items  enable row level security;

-- ---------- profiles -------------------------------------------------
-- Lecture: chacun voit son propre profil + un dev voit tout le monde.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_dev());

-- Mise à jour: un user peut éditer son display_name (mais PAS son rôle).
-- Pour empêcher ça, on coupe le UPDATE pour les non-dev sur la colonne role
-- via un trigger guard ci-dessous. Les devs peuvent tout updater.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_update_dev on public.profiles;
create policy profiles_update_dev on public.profiles
for update to authenticated
using (public.is_dev())
with check (public.is_dev());

-- Trigger anti-escalade: un user non-dev ne peut pas changer son rôle
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_dev() then
    raise exception 'role change not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
before update on public.profiles
for each row execute function public.guard_profile_role();

-- ---------- categories ----------------------------------------------
-- Lecture pour tout authentifié, écriture réservée aux devs
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
for select to authenticated using (true);

drop policy if exists categories_write_dev on public.categories;
create policy categories_write_dev on public.categories
for all to authenticated
using (public.is_dev())
with check (public.is_dev());

-- ---------- sessions -------------------------------------------------
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions
for select to authenticated using (true);

drop policy if exists sessions_write_dev on public.sessions;
create policy sessions_write_dev on public.sessions
for all to authenticated
using (public.is_dev())
with check (public.is_dev());

-- ---------- feed_items -----------------------------------------------
-- Lecture: tout authentifié peut voir. Le filtrage de visibilité
-- (published_at/expires_at/session active) se fait dans le repo
-- pour que les devs puissent voir TOUT en mode admin.
drop policy if exists feed_items_select on public.feed_items;
create policy feed_items_select on public.feed_items
for select to authenticated using (true);

drop policy if exists feed_items_write_dev on public.feed_items;
create policy feed_items_write_dev on public.feed_items
for all to authenticated
using (public.is_dev())
with check (public.is_dev() and created_by = auth.uid());

-- =====================================================================
--  Privilèges PostgREST
-- =====================================================================
grant select, update on public.profiles   to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.sessions   to authenticated;
grant select, insert, update, delete on public.feed_items to authenticated;


-- ---------------------------------------------------------------------
--  0004_notification_deliveries.sql
-- ---------------------------------------------------------------------

-- =====================================================================
--  Audit des envois multi-canaux (email, SMS, WhatsApp...).
--  Une ligne = une tentative d'envoi sur un canal donné.
-- =====================================================================

-- Enums
do $$ begin
  create type public.message_channel as enum ('email', 'sms', 'whatsapp');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_status as enum ('queued', 'sent', 'failed', 'skipped');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------
create table if not exists public.notification_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  channel             public.message_channel not null,
  recipient           text not null,                 -- email, phone, etc.
  subject             text,
  body                text not null,
  status              public.delivery_status not null,
  provider            text,                          -- 'mock', 'resend', 'twilio'...
  provider_message_id text,
  error               text,
  metadata            jsonb not null default '{}'::jsonb,
  user_id             uuid references auth.users(id) on delete set null,
  source              text,                          -- 'reminder.cron', 'manual', 'feed_item'...
  source_id           uuid,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);

create index if not exists deliveries_user_idx
  on public.notification_deliveries (user_id, created_at desc);
create index if not exists deliveries_channel_idx
  on public.notification_deliveries (channel, created_at desc);
create index if not exists deliveries_status_idx
  on public.notification_deliveries (status, created_at desc);
create index if not exists deliveries_source_idx
  on public.notification_deliveries (source, source_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.notification_deliveries enable row level security;

-- Lecture: l'utilisateur voit ses propres envois, le dev voit tout.
drop policy if exists deliveries_select on public.notification_deliveries;
create policy deliveries_select on public.notification_deliveries
for select to authenticated
using (user_id = auth.uid() or public.is_dev());

-- Pas de policy d'écriture pour les rôles authentifiés.
-- Les inserts/updates passent UNIQUEMENT par le service-role (notify())
-- qui bypass la RLS.

grant select on public.notification_deliveries to authenticated;


-- ---------------------------------------------------------------------
--  0005_hierarchy_and_ownership.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0006_self_service.sql
-- ---------------------------------------------------------------------

-- =====================================================================
--  Self-service: tout se configure dans l'app, plus besoin de SQL manuel.
--
--  Deux choses gérées ici:
--   1) Le premier utilisateur inscrit devient automatiquement 'dev'
--      (résout le problème poule/œuf du premier admin).
--   2) Les catégories seed (owner_id NULL) peuvent être réclamées par
--      n'importe quel dev via une policy dédiée (pas besoin de SQL).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Backfill: si aucun dev n'existe encore, promouvoir le plus ancien
--    utilisateur. Indispensable pour les comptes déjà créés avant
--    l'introduction de cette logique.
-- ---------------------------------------------------------------------
update public.profiles
set role = 'dev'
where id = (
  select id from public.profiles
  order by created_at asc
  limit 1
)
and not exists (select 1 from public.profiles where role = 'dev');

-- ---------------------------------------------------------------------
-- 2) Trigger handle_new_user: le 1er user (et seulement le 1er) devient dev.
-- ---------------------------------------------------------------------
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

  insert into public.profiles (id, role)
  values (
    new.id,
    case when no_dev_yet then 'dev'::public.app_role else 'employee'::public.app_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Policy "claim": un dev peut s'attribuer une catégorie système
--    (owner_id NULL) en la mettant à son propre uid. Coexiste avec la
--    policy categories_write_own (les deux fonctionnent en OR).
-- ---------------------------------------------------------------------
drop policy if exists categories_claim_unclaimed on public.categories;
create policy categories_claim_unclaimed on public.categories
for update to authenticated
using (public.is_dev() and owner_id is null)
with check (public.is_dev() and owner_id = auth.uid());


-- ---------------------------------------------------------------------
--  0007_targeting.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0008_branding.sql
-- ---------------------------------------------------------------------

-- =====================================================================
--  Branding configurable — pour pouvoir revendre l'app en white-label.
--   - Table `app_settings` singleton (1 ligne)
--   - Storage bucket `branding` (public) avec upload réservé aux devs
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Table singleton app_settings
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  id          int  primary key default 1 check (id = 1),
  app_name    text not null default 'App Notification',
  app_tagline text,
  logo_url    text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

-- Force la ligne unique
insert into public.app_settings (id) values (1)
on conflict (id) do nothing;

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

-- Lecture publique (la landing page non-authentifiée affiche le nom)
drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
for select to anon, authenticated using (true);

-- Update réservé aux devs
drop policy if exists app_settings_update_dev on public.app_settings;
create policy app_settings_update_dev on public.app_settings
for update to authenticated
using (public.is_dev())
with check (public.is_dev());

grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;

-- ---------------------------------------------------------------------
-- 2) Storage bucket 'branding' (public, devs only write)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Politiques Storage
drop policy if exists "branding public read" on storage.objects;
create policy "branding public read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'branding');

drop policy if exists "branding upload by dev" on storage.objects;
create policy "branding upload by dev" on storage.objects
for insert to authenticated
with check (bucket_id = 'branding' and public.is_dev());

drop policy if exists "branding update by dev" on storage.objects;
create policy "branding update by dev" on storage.objects
for update to authenticated
using (bucket_id = 'branding' and public.is_dev())
with check (bucket_id = 'branding' and public.is_dev());

drop policy if exists "branding delete by dev" on storage.objects;
create policy "branding delete by dev" on storage.objects
for delete to authenticated
using (bucket_id = 'branding' and public.is_dev());


-- ---------------------------------------------------------------------
--  0009_schedules.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0010_notification_config.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0011_engagement.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0012_advanced_features.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
--  0013_profile_phone.sql
-- ---------------------------------------------------------------------

-- =====================================================================
--  Ajout prénom, nom, téléphone au profil
--  Mot de passe = 4 derniers chiffres du téléphone
-- =====================================================================

-- Nouvelles colonnes
alter table public.profiles
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists phone       text,
  add column if not exists phone_last4 text;

-- Mise à jour du trigger handle_new_user pour prendre les métadonnées
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, first_name, last_name, phone, phone_last4, email)
  values (
    new.id,
    'employee',
    coalesce(new.raw_user_meta_data->>'first_name', null),
    coalesce(new.raw_user_meta_data->>'last_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null),
    coalesce(new.raw_user_meta_data->>'phone_last4', null),
    new.email
  )
  on conflict (id) do update set
    first_name = coalesce(excluded.first_name, profiles.first_name),
    last_name  = coalesce(excluded.last_name, profiles.last_name),
    phone      = coalesce(excluded.phone, profiles.phone),
    phone_last4= coalesce(excluded.phone_last4, profiles.phone_last4),
    email      = coalesce(excluded.email, profiles.email);
  return new;
end;
$$;
