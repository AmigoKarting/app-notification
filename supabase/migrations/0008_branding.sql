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
