-- =====================================================================
--  Système de rôles + fil de notifications/rappels in-app
--  Indépendant du système d'envoi email (employees + reminders).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
-- Note : la valeur 'employee' a été renommée en 'gerant' (migration 0019).
-- On crée donc directement l'enum avec 'gerant' pour que les nouveaux
-- déploiements partent du nom final. Les inserts plus bas utilisent 'gerant'.
do $$ begin create type public.app_role        as enum ('gerant', 'dev'); exception when duplicate_object then null; end $$;
do $$ begin create type public.feed_item_kind  as enum ('notification', 'reminder'); exception when duplicate_object then null; end $$;
do $$ begin create type public.feed_priority   as enum ('low', 'normal', 'high'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles  (extension de auth.users avec rôle)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.app_role not null default 'gerant',
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
  values (new.id, 'gerant')
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
select u.id, 'gerant'
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
