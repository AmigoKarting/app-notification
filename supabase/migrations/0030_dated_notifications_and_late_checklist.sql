-- Dated notifications (recyclage, etc.) with snooze support
create table public.dated_notifications (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  trigger_time time not null default '09:00',
  title text not null,
  body text not null,
  target_role text not null default 'superviseur',
  is_active boolean not null default true,
  snoozed_to date,
  created_at timestamptz not null default now()
);

-- Log to avoid duplicate sends
create table public.dated_notification_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.dated_notifications(id) on delete cascade,
  date date not null,
  sent_at timestamptz not null default now(),
  unique (notification_id, date)
);

-- Late checklist tracking config
create table public.late_checklist_config (
  id uuid primary key default gen_random_uuid(),
  delay_minutes int not null default 60,
  is_active boolean not null default true,
  title text not null default 'Checklist en retard',
  body text not null default 'Une caissière n''a pas rempli sa checklist depuis plus d''une heure après l''ouverture.'
);

-- Log to avoid spamming (one alert per day)
create table public.late_checklist_log (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  sent_at timestamptz not null default now()
);

-- RLS
alter table public.dated_notifications enable row level security;
alter table public.dated_notification_log enable row level security;
alter table public.late_checklist_config enable row level security;
alter table public.late_checklist_log enable row level security;

create policy "read dated_notifications" on public.dated_notifications for select to authenticated using (true);
create policy "read dated_notification_log" on public.dated_notification_log for select to authenticated using (true);
create policy "read late_checklist_config" on public.late_checklist_config for select to authenticated using (true);
create policy "read late_checklist_log" on public.late_checklist_log for select to authenticated using (true);

-- Seed late checklist config
insert into public.late_checklist_config (delay_minutes, title, body) values
  (60, 'Checklist en retard', 'Une caissière n''a pas rempli sa checklist depuis plus d''une heure après l''ouverture.');
