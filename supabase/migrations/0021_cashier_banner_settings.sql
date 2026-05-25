-- =====================================================================
--  Paramètres configurables pour la bannière de rappel checklist caissière
--   - cashier_banner_enabled : on/off du rappel
--   - cashier_banner_message : texte custom (null → fallback i18n côté code)
--   - cashier_banner_cta     : libellé bouton custom (null → fallback i18n)
-- =====================================================================

alter table public.app_settings
  add column if not exists cashier_banner_enabled boolean not null default true,
  add column if not exists cashier_banner_message text,
  add column if not exists cashier_banner_cta     text;
