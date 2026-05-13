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
