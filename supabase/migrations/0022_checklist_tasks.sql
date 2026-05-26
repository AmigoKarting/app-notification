-- =====================================================================
--  Tâches de la checklist caissière, gérables depuis l'UI admin.
--  Remplace l'array codé en dur dans src/domain/checklists/items.ts.
--
--  - task_key : identifiant stable (utilisé dans cashier_checklists.completed_items[])
--  - section  : opening / during / closing (groupes d'affichage)
--  - label    : texte affiché à la caissière
--  - sort_order : ordre dans la section
--  - is_active : décocher = tâche cachée du formulaire sans suppression
-- =====================================================================

create table if not exists public.checklist_tasks (
  id          uuid primary key default gen_random_uuid(),
  task_key    text not null unique,
  section     text not null check (section in ('opening', 'during', 'closing')),
  label       text not null check (length(trim(label)) > 0),
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists checklist_tasks_section_order_idx
  on public.checklist_tasks (section, sort_order, id);

create index if not exists checklist_tasks_active_idx
  on public.checklist_tasks (is_active);

drop trigger if exists trg_checklist_tasks_updated_at on public.checklist_tasks;
create trigger trg_checklist_tasks_updated_at
before update on public.checklist_tasks
for each row execute function public.set_updated_at();

alter table public.checklist_tasks enable row level security;

drop policy if exists checklist_tasks_select on public.checklist_tasks;
create policy checklist_tasks_select on public.checklist_tasks
for select to authenticated using (true);

drop policy if exists checklist_tasks_write_dev on public.checklist_tasks;
create policy checklist_tasks_write_dev on public.checklist_tasks
for all to authenticated
using (public.is_dev()) with check (public.is_dev());

grant select on public.checklist_tasks to authenticated;
grant insert, update, delete on public.checklist_tasks to authenticated;

-- ---------------------------------------------------------------------
-- Seed : 20 tâches actuellement codées en dur (libellés français).
-- ---------------------------------------------------------------------
insert into public.checklist_tasks (task_key, section, label, sort_order) values
  ('voicemail',                'opening',  'J''ai pris les messages vocaux et retourné les appels.', 10),
  ('hoods_wash_opening',       'opening',  'J''ai pris les cagoules et parti une brassée.', 20),
  ('check_bathrooms_opening',  'opening',  'J''ai vérifié les salles de bains.', 30),
  ('check_reservations',       'opening',  'J''ai pris connaissance des réservations à venir.', 40),
  ('clean_bathrooms_during',   'during',   'J''ai nettoyé les salles de bain et rempli le papier/savon.', 10),
  ('hoods_wash_during',        'during',   'J''ai pris les cagoules et parti une brassée.', 20),
  ('clean_site_tables',        'during',   'J''ai fait le tour du site pour ramasser les déchets et nettoyé les tables et bancs.', 30),
  ('empty_trash_recycling',    'during',   'J''ai vidé les poubelles/recyclage à l''intérieur et à l''extérieur.', 40),
  ('copy_forms',               'during',   'S''il reste moins de 5 exemplaires d''un formulaire, j''en ai fait 25 copies.', 50),
  ('check_waivers',            'during',   'S''il reste moins de 10 dégagements de responsabilités, j''ai averti le gérant.', 60),
  ('fill_fridge_displays',     'closing',  'J''ai rempli le frigidaire et les présentoirs.', 10),
  ('clean_site_red_zone',      'closing',  'J''ai fait le tour du site pour ramasser les déchets (zone rouge).', 20),
  ('clean_bathrooms_closing',  'closing',  'J''ai nettoyé les salles de bain et rempli le papier/savon.', 30),
  ('sweep_mop_toilets',        'closing',  'J''ai balayé le plancher et passé la vadrouille des toilettes.', 40),
  ('fold_hoods_dryer',         'closing',  'J''ai plié les cagoules dans la sécheuse et la laveuse est vide.', 50),
  ('clean_workspace',          'closing',  'Mon environnement de travail est propre et bien rangé.', 60),
  ('sweep_mop_kiosk',          'closing',  'J''ai passé le balai et la vadrouille sur le plancher du kiosque.', 70),
  ('collect_dirty_hoods',      'closing',  'J''ai récupéré les cagoules sales dans le garage.', 80),
  ('clean_pizza_machine',      'closing',  'J''ai bien nettoyé la machine à pizza.', 90),
  ('cash_closing',             'closing',  'J''ai fait ma clôture de caisse.', 100)
on conflict (task_key) do nothing;
