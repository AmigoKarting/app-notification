-- Ajoute le rôle "caissiere" à l'enum app_role.
-- Les caissières ont les mêmes accès que les employés (feed, settings).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caissiere';
