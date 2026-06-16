-- Rename role 'gerant' to 'superviseur' (idempotent).

-- 1. Rename enum value
do $$
begin
  if exists (
    select 1 from pg_enum
    where enumlabel = 'gerant'
      and enumtypid = 'public.app_role'::regtype
  ) then
    alter type public.app_role rename value 'gerant' to 'superviseur';
  end if;
end $$;

-- 2. Update roles table slug + name (drop FK temporarily to avoid circular constraint)
alter table public.role_permissions drop constraint if exists role_permissions_role_slug_fkey;

update public.roles
set slug = 'superviseur', name = 'Superviseur'
where slug = 'gerant';

update public.role_permissions
set role_slug = 'superviseur'
where role_slug = 'gerant';

alter table public.role_permissions
add constraint role_permissions_role_slug_fkey
foreign key (role_slug) references public.roles(slug) on delete cascade;

-- 3. Update the delete_role function guard list
create or replace function public.delete_role(p_slug text)
returns void
language plpgsql
security definer
as $$
begin
  if p_slug in ('dev', 'superviseur', 'caissiere', 'employee') then
    raise exception 'Cannot delete built-in role %', p_slug;
  end if;
  delete from public.roles where slug = p_slug;
end;
$$;
