-- =====================================================================
--  Catégorie réservée "checklist-caisse"
--  - Slug réservé utilisé par le code pour identifier les notifs
--    spécifiques aux caissières (séparation visuelle dans /settings).
--  - owner_id NULL = catégorie "système" (non éditable depuis l'UI).
-- =====================================================================

insert into public.categories (slug, name, color, icon, owner_id)
values ('checklist-caisse', 'Checklist caisse', '#f59e0b', '📋', null)
on conflict (slug) do nothing;
