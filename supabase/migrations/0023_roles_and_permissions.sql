-- =====================================================================
--  RBAC : rôles personnalisables + permissions par rôle
--
--  - `roles` : tous les rôles (slug = valeur de app_role enum)
--      → 3 rôles système préchargés : dev, gerant, caissiere
--      → des rôles custom peuvent être ajoutés via create_custom_role()
--  - `role_permissions` : permissions actives pour chaque rôle
--      → liste de permissions définie dans le code TS (permissions.ts)
--  - `create_custom_role(slug, ...)` : étend dynamiquement l'enum
--    app_role puis insère dans `roles`.
--  - `delete_custom_role(slug)` : retire un rôle non-système qui n'est
--    pas en cours d'utilisation.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Prérequis défensifs : recrée set_updated_at, is_dev et l'enum
-- app_role si absents (cas d'un projet partiellement migré).
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

do $$ begin
  create type public.app_role as enum ('dev', 'gerant', 'caissiere');
exception when duplicate_object then null;
end $$;

create or replace function public.is_dev()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = 'dev'
  );
$$;

-- ---------------------------------------------------------------------
-- 1) Table roles
-- ---------------------------------------------------------------------
create table if not exists public.roles (
  slug         text primary key,
  name         text not null check (length(trim(name)) > 0),
  description  text,
  color        text not null default '#6b7280',
  icon         text,
  is_system    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

alter table public.roles enable row level security;

drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
for select to authenticated using (true);

drop policy if exists roles_write_dev on public.roles;
create policy roles_write_dev on public.roles
for all to authenticated
using (public.is_dev()) with check (public.is_dev());

grant select on public.roles to authenticated;
grant insert, update, delete on public.roles to authenticated;

-- Seed des rôles système (slugs identiques aux valeurs app_role)
insert into public.roles (slug, name, description, color, icon, is_system) values
  ('dev',       'Développeur', 'Accès complet à toute l''administration.', '#7c3aed', '🛠️', true),
  ('gerant',    'Gérant',      'Lecture du fil de notifications.',         '#6b7280', '👤', true),
  ('caissiere', 'Caissière',   'Checklist quotidienne + fil de notifications.', '#f59e0b', '💰', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2) Table role_permissions
-- ---------------------------------------------------------------------
create table if not exists public.role_permissions (
  role_slug   text not null references public.roles(slug) on delete cascade,
  permission  text not null,
  primary key (role_slug, permission)
);

create index if not exists role_permissions_role_idx
  on public.role_permissions (role_slug);

alter table public.role_permissions enable row level security;

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
for select to authenticated using (true);

drop policy if exists role_permissions_write_dev on public.role_permissions;
create policy role_permissions_write_dev on public.role_permissions
for all to authenticated
using (public.is_dev()) with check (public.is_dev());

grant select on public.role_permissions to authenticated;
grant insert, update, delete on public.role_permissions to authenticated;

-- Seed des permissions par défaut pour les rôles système.
-- (La liste complète est définie côté code dans permissions.ts ;
--  ici on n'insère que les permissions à accorder à chaque rôle.)
insert into public.role_permissions (role_slug, permission) values
  -- dev : accès complet (toutes les permissions admin)
  ('dev', 'admin.access'),
  ('dev', 'admin.users'),
  ('dev', 'admin.categories'),
  ('dev', 'admin.sessions'),
  ('dev', 'admin.teams'),
  ('dev', 'admin.templates'),
  ('dev', 'admin.schedules'),
  ('dev', 'admin.deliveries'),
  ('dev', 'admin.analytics'),
  ('dev', 'admin.branding'),
  ('dev', 'admin.feed'),
  ('dev', 'admin.checklists_history'),
  ('dev', 'admin.checklist_tasks'),
  ('dev', 'admin.roles'),
  ('dev', 'feed.read'),
  ('dev', 'feed.write'),
  ('dev', 'checklist.view'),
  ('dev', 'checklist.submit'),
  ('dev', 'notifications.mute'),
  ('dev', 'settings.cashier_banner'),
  -- gérant : juste lire le fil
  ('gerant', 'feed.read'),
  -- caissière : fil + checklist
  ('caissiere', 'feed.read'),
  ('caissiere', 'checklist.view'),
  ('caissiere', 'checklist.submit')
on conflict (role_slug, permission) do nothing;

-- ---------------------------------------------------------------------
-- 3) RPC : créer un rôle custom (étend l'enum app_role)
-- ---------------------------------------------------------------------
create or replace function public.create_custom_role(
  p_slug        text,
  p_name        text,
  p_description text,
  p_color       text,
  p_icon        text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dev() then
    raise exception 'forbidden: only devs can create roles';
  end if;
  if p_slug is null or p_slug !~ '^[a-z][a-z0-9_]{1,40}$' then
    raise exception 'invalid slug — use lowercase letters, digits, underscores (2-41 chars)';
  end if;
  if p_slug in ('dev', 'gerant', 'caissiere', 'employee') then
    raise exception 'reserved slug';
  end if;

  -- 1) Étendre l'enum app_role pour permettre profiles.role = p_slug
  execute format('alter type public.app_role add value if not exists %L', p_slug);

  -- 2) Enregistrer le rôle dans la table
  insert into public.roles (slug, name, description, color, icon, is_system)
  values (
    p_slug,
    coalesce(nullif(trim(p_name), ''), p_slug),
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(nullif(trim(coalesce(p_color, '')), ''), '#6b7280'),
    nullif(trim(coalesce(p_icon, '')), ''),
    false
  );
end;
$$;

grant execute on function public.create_custom_role(text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4) RPC : supprimer un rôle custom
--    (Refuse si is_system OU si au moins un profil l'utilise.)
-- ---------------------------------------------------------------------
create or replace function public.delete_custom_role(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_system boolean;
  v_in_use    boolean;
begin
  if not public.is_dev() then
    raise exception 'forbidden';
  end if;

  select is_system into v_is_system from public.roles where slug = p_slug;
  if v_is_system is null then
    raise exception 'unknown role';
  end if;
  if v_is_system then
    raise exception 'system roles cannot be deleted';
  end if;

  select exists(select 1 from public.profiles where role::text = p_slug)
  into v_in_use;
  if v_in_use then
    raise exception 'role still in use — reassign users first';
  end if;

  delete from public.roles where slug = p_slug;
  -- Note : la valeur reste dans l'enum app_role (PostgreSQL ne permet
  -- pas de retirer une valeur d'enum). Pas grave : la valeur n'est
  -- plus assignable via l'UI car absente de `roles`.
end;
$$;

grant execute on function public.delete_custom_role(text) to authenticated;
