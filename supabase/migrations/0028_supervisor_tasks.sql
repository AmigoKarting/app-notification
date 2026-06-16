-- Supervisor tasks: task definitions + daily tracking with verification popup

-- 1. Task definitions
create table if not exists public.supervisor_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text unique not null,
  section text not null, -- 'caisse' or 'piste'
  label text not null,
  notes text, -- sub-instructions displayed under the task
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.supervisor_tasks enable row level security;

create policy "Authenticated users can read supervisor_tasks"
  on public.supervisor_tasks for select
  to authenticated using (true);

-- 2. Daily task records (assign + verify)
create table if not exists public.supervisor_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.supervisor_tasks(id) on delete cascade,
  date date not null default current_date,
  supervisor_id uuid not null references auth.users(id),
  assigned_at timestamptz, -- when "à faire" was checked
  verified_at timestamptz, -- when "fait et vérifié" was checked
  done_by text, -- who did the work (free text from popup)
  rating int check (rating >= 1 and rating <= 10),
  no_time_to_finish boolean not null default false,
  quality_certified boolean not null default false,
  created_at timestamptz not null default now(),
  unique(task_id, date, supervisor_id)
);

alter table public.supervisor_daily_tasks enable row level security;

create policy "Supervisors can manage their own daily tasks"
  on public.supervisor_daily_tasks for all
  to authenticated using (supervisor_id = auth.uid());

-- 3. Seed tasks

-- Caisse
insert into public.supervisor_tasks (task_key, section, label, sort_order) values
  ('caisse_dechets_148', 'caisse', 'Ramasser les déchets sur le bord de la 148 et notre chemin', 10),
  ('caisse_herbes_clotures', 'caisse', 'Arracher les mauvaises herbes autour des poteaux de clôtures', 20),
  ('caisse_herbes_batiments', 'caisse', 'Arracher les mauvaises herbes autour des poteaux des bâtiments', 30),
  ('caisse_microondes', 'caisse', 'Nettoyer les micro-ondes', 40),
  ('caisse_fenetres_cabane', 'caisse', 'Nettoyer les fenêtres de la cabane', 50);

-- Piste
insert into public.supervisor_tasks (task_key, section, label, sort_order) values
  ('piste_strapping', 'piste', 'Strapping', 10),
  ('piste_flats', 'piste', 'Changer les flats', 20),
  ('piste_blower', 'piste', 'Nettoyer la piste au blower', 30),
  ('piste_shopvac_roche', 'piste', 'Aspirer la roche dans les pneus, où il y a un mur de béton, au shopvac (quand c''est sec)', 40),
  ('piste_pneus', 'piste', 'Faire des pneus', 50),
  ('piste_casques', 'piste', 'Réparer les casques', 60),
  ('piste_ganses', 'piste', 'Vérifier les ganses', 70),
  ('piste_visieres', 'piste', 'Changer les visières égratignées', 80),
  ('piste_paddings', 'piste', 'Changer les paddings', 90),
  ('piste_gazon', 'piste', 'Couper le gazon', 100),
  ('piste_souffler_chemin', 'piste', 'Souffler notre chemin', 110),
  ('piste_ranger_garages', 'piste', 'Nettoyer/Ranger le site autour des garages', 120),
  ('piste_balais_garage', 'piste', 'Balais plancher garage Super-Kart', 130),
  ('piste_shopvac_plafond', 'piste', 'Shopvac plafond garage Super-Kart', 140),
  ('piste_vetements', 'piste', 'Ramasser les vêtements qui traînent', 150),
  ('piste_herbes_pneus_mur', 'piste', 'Arracher les mauvaises herbes entre les pneus et le mur de béton', 160),
  ('piste_herbes_pneus_fixes', 'piste', 'Arracher les mauvaises herbes qui poussent dans les pneus fixes', 170);

-- Add notes for "Couper le gazon"
update public.supervisor_tasks
set notes = '• Fais très attention pour ne pas envoyer une roche sur une personne ou une auto
• N''envoie jamais de gazon dans le sable
• Ne fais pas de motons au milieu
• N''oublie pas de bouger les tables
• N''oublie pas de souffler ton gazon sur l''asphalte'
where task_key = 'piste_gazon';
