-- Rename role 'employee' to 'gerant' (idempotent).
-- Sur les nouveaux déploiements, 0003 crée déjà l'enum avec 'gerant',
-- donc 'employee' n'existe pas et on ne fait rien.
do $$
begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'employee'
  ) then
    alter type public.app_role rename value 'employee' to 'gerant';
  end if;
end $$;
