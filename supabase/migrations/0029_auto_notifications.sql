-- Business seasons (recurring yearly, date ranges as month/day)
create table public.business_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_month int not null check (start_month between 1 and 12),
  start_day int not null check (start_day between 1 and 31),
  end_month int not null check (end_month between 1 and 12),
  end_day int not null check (end_day between 1 and 31),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Business hours per season per day of week
-- day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=holiday
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.business_seasons(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 7),
  open_time time not null,
  close_time time not null,
  unique (season_id, day_of_week)
);

-- Holidays (specific dates, checked each year)
create table public.business_holidays (
  date date primary key,
  label text
);

-- Auto-notification definitions
create table public.auto_notifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null check (trigger_type in ('opening', 'fixed_time', 'closing')),
  trigger_time time,
  offset_minutes int not null default 0,
  title text not null,
  body text not null,
  target_role text not null default 'superviseur',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Log to avoid duplicate sends per day
create table public.auto_notification_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.auto_notifications(id) on delete cascade,
  date date not null,
  sent_at timestamptz not null default now(),
  unique (notification_id, date)
);

-- RLS
alter table public.business_seasons enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_holidays enable row level security;
alter table public.auto_notifications enable row level security;
alter table public.auto_notification_log enable row level security;

create policy "read business_seasons" on public.business_seasons for select to authenticated using (true);
create policy "read business_hours" on public.business_hours for select to authenticated using (true);
create policy "read business_holidays" on public.business_holidays for select to authenticated using (true);
create policy "read auto_notifications" on public.auto_notifications for select to authenticated using (true);
create policy "read auto_notification_log" on public.auto_notification_log for select to authenticated using (true);

-- ═══ Seed seasons ═══

insert into public.business_seasons (name, start_month, start_day, end_month, end_day, sort_order) values
  ('Printemps',  4, 12,  5, 18, 1),
  ('Pré-été',    5, 19,  6, 23, 2),
  ('Été',        6, 24,  8, 28, 3),
  ('Automne',    8, 29, 10, 26, 4);

-- ═══ Seed business hours ═══

-- Printemps: Ven 18-22, Sam 11-22, Dim 11-21, Fériés 11-21
with s as (select id from public.business_seasons where name = 'Printemps')
insert into public.business_hours (season_id, day_of_week, open_time, close_time)
select s.id, v.dow, v.o::time, v.c::time from s,
(values (5,'18:00','22:00'),(6,'11:00','22:00'),(0,'11:00','21:00'),(7,'11:00','21:00')) as v(dow,o,c);

-- Pré-été: Lun-Ven 18-22, Sam 11-22, Dim 11-22
with s as (select id from public.business_seasons where name = 'Pré-été')
insert into public.business_hours (season_id, day_of_week, open_time, close_time)
select s.id, v.dow, v.o::time, v.c::time from s,
(values (1,'18:00','22:00'),(2,'18:00','22:00'),(3,'18:00','22:00'),(4,'18:00','22:00'),
        (5,'18:00','22:00'),(6,'11:00','22:00'),(0,'11:00','22:00')) as v(dow,o,c);

-- Été: Lun-Ven 13-22, Sam 11-22, Dim 11-22, Fériés 11-22
with s as (select id from public.business_seasons where name = 'Été')
insert into public.business_hours (season_id, day_of_week, open_time, close_time)
select s.id, v.dow, v.o::time, v.c::time from s,
(values (1,'13:00','22:00'),(2,'13:00','22:00'),(3,'13:00','22:00'),(4,'13:00','22:00'),
        (5,'13:00','22:00'),(6,'11:00','22:00'),(0,'11:00','22:00'),(7,'11:00','22:00')) as v(dow,o,c);

-- Automne: Ven 18-22, Sam 11-22, Dim 11-21, Fériés 11-21
with s as (select id from public.business_seasons where name = 'Automne')
insert into public.business_hours (season_id, day_of_week, open_time, close_time)
select s.id, v.dow, v.o::time, v.c::time from s,
(values (5,'18:00','22:00'),(6,'11:00','22:00'),(0,'11:00','21:00'),(7,'11:00','21:00')) as v(dow,o,c);

-- ═══ Seed auto-notifications ═══

insert into public.auto_notifications (name, trigger_type, trigger_time, title, body) values
  ('Ouverture - Équipement',  'opening',    null,    'Vérification d''ouverture',   'L''ordinateur et l''imprimante fonctionnent-ils correctement ?'),
  ('Ouverture - Karts',       'opening',    null,    'Inspection des karts',        'As-tu fait l''inspection des karts ?'),
  ('Ouverture - Essence',     'opening',    null,    'Niveau d''essence',           'Le niveau d''essence est-il suffisant ?'),
  ('20h - Karts brisés',      'fixed_time', '20:00', 'Karts brisés',               'Y a-t-il des karts brisés à signaler ?'),
  ('20h - Crevaisons',        'fixed_time', '20:00', 'Crevaisons',                 'Y a-t-il des crevaisons à signaler ?'),
  ('Fermeture - Zone pneus',  'closing',    null,    'Vérification zone pneus',    'La zone pneus correspond-elle à la photo de référence ?'),
  ('Fermeture - Meuble ordi', 'closing',    null,    'Vérification meuble ordi',   'Le meuble ordi correspond-il à la photo de référence ?'),
  ('Fermeture - Caisse',      'closing',    null,    'Vérification caisse',        'La caisse correspond-elle à la photo de référence ?');
