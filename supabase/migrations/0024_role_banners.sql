-- =====================================================================
--  Bannières par rôle (système générique)
--
--  Une bannière par rôle (slug PK), configurable depuis l'UI dev :
--    - message + bouton + lien + icône + couleur
--    - dismiss_condition : null = toujours visible, sinon clé reconnue
--      par le code (ex: 'cashier_checklist_done' pour la caissière).
--
--  Remplace l'ancien système hardcodé cashier_banner_* dans app_settings.
--  Les anciennes colonnes restent là pour rétrocompat mais le code les
--  ignore ; on backfill role_banners depuis ces valeurs au seed.
-- =====================================================================

create table if not exists public.role_banners (
  role_slug          text primary key references public.roles(slug) on delete cascade,
  enabled            boolean not null default true,
  message            text not null check (length(trim(message)) > 0),
  cta_label          text,
  cta_url            text not null default '/',
  icon               text not null default '📋',
  color              text not null default '#f59e0b',
  -- Clé reconnue par le code pour faire disparaître la bannière
  -- selon un état applicatif (null = toujours visible).
  -- Valeurs supportées : 'cashier_checklist_done'
  dismiss_condition  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_role_banners_updated_at on public.role_banners;
create trigger trg_role_banners_updated_at
before update on public.role_banners
for each row execute function public.set_updated_at();

alter table public.role_banners enable row level security;

-- Tout authentifié peut lire (chaque user lit la bannière de son propre rôle).
drop policy if exists role_banners_select on public.role_banners;
create policy role_banners_select on public.role_banners
for select to authenticated using (true);

-- Seuls les devs peuvent modifier.
drop policy if exists role_banners_write_dev on public.role_banners;
create policy role_banners_write_dev on public.role_banners
for all to authenticated
using (public.is_dev()) with check (public.is_dev());

grant select on public.role_banners to authenticated;
grant insert, update, delete on public.role_banners to authenticated;

-- ---------------------------------------------------------------------
-- Seed : récupère l'ancienne config cashier_banner_* dans app_settings
-- et la migre vers role_banners(role_slug='caissiere').
-- ---------------------------------------------------------------------
do $$
declare
  v_enabled boolean;
  v_message text;
  v_cta     text;
begin
  -- Lecture défensive (les colonnes peuvent ne pas exister)
  begin
    select cashier_banner_enabled, cashier_banner_message, cashier_banner_cta
      into v_enabled, v_message, v_cta
      from public.app_settings where id = 1;
  exception when undefined_column then
    v_enabled := true;
    v_message := null;
    v_cta     := null;
  end;

  insert into public.role_banners
    (role_slug, enabled, message, cta_label, cta_url, icon, color, dismiss_condition)
  values (
    'caissiere',
    coalesce(v_enabled, true),
    coalesce(nullif(trim(coalesce(v_message, '')), ''),
             'Oublie pas de remplir les checklists !'),
    coalesce(nullif(trim(coalesce(v_cta, '')), ''), 'Ouvrir'),
    '/checklist',
    '📋',
    '#f59e0b',
    'cashier_checklist_done'
  )
  on conflict (role_slug) do nothing;
end $$;
