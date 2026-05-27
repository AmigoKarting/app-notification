-- =====================================================================
--  Paramètres configurables pour la bannière de rappel checklist caissière
--   - cashier_banner_enabled : on/off du rappel
--   - cashier_banner_message : texte custom (null → fallback i18n côté code)
--   - cashier_banner_cta     : libellé bouton custom (null → fallback i18n)
--
--  Défensif : crée d'abord app_settings si la migration 0008 (branding)
--  n'a pas encore été appliquée. Idempotent dans tous les cas.
-- =====================================================================

-- Si la table n'existe pas encore (migration 0008 pas exécutée),
-- on la crée avec toutes les colonnes (y compris celles ajoutées ici).
create table if not exists public.app_settings (
  id          int  primary key default 1 check (id = 1),
  app_name    text not null default 'App Notification',
  app_tagline text,
  logo_url    text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

-- Force la ligne unique au cas où elle n'existerait pas non plus.
insert into public.app_settings (id) values (1)
on conflict (id) do nothing;

-- Active le RLS et les policies de base (si pas déjà fait par 0008).
alter table public.app_settings enable row level security;

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
for select to anon, authenticated using (true);

drop policy if exists app_settings_update_dev on public.app_settings;
create policy app_settings_update_dev on public.app_settings
for update to authenticated
using (public.is_dev())
with check (public.is_dev());

grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;

-- Ajout des nouvelles colonnes spécifiques bannière caissière.
alter table public.app_settings
  add column if not exists cashier_banner_enabled boolean not null default true,
  add column if not exists cashier_banner_message text,
  add column if not exists cashier_banner_cta     text;
