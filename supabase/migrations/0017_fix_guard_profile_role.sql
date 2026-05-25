-- Fix: allow service_role (admin client) to change user roles.
-- The application layer already validates the caller is a dev via requireDev().

CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.role IS DISTINCT FROM old.role
     AND auth.role() IS DISTINCT FROM 'service_role'
     AND NOT public.is_dev() THEN
    RAISE EXCEPTION 'role change not allowed';
  END IF;
  RETURN new;
END;
$$;
