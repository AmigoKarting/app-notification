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
    case when no_dev_yet then 'dev'::public.app_role else 'gerant'::public.app_role end
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
