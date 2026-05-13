-- =====================================================================
--  Audit des envois multi-canaux (email, SMS, WhatsApp...).
--  Une ligne = une tentative d'envoi sur un canal donné.
-- =====================================================================

-- Enums
do $$ begin
  create type public.message_channel as enum ('email', 'sms', 'whatsapp');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_status as enum ('queued', 'sent', 'failed', 'skipped');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------
create table if not exists public.notification_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  channel             public.message_channel not null,
  recipient           text not null,                 -- email, phone, etc.
  subject             text,
  body                text not null,
  status              public.delivery_status not null,
  provider            text,                          -- 'mock', 'resend', 'twilio'...
  provider_message_id text,
  error               text,
  metadata            jsonb not null default '{}'::jsonb,
  user_id             uuid references auth.users(id) on delete set null,
  source              text,                          -- 'reminder.cron', 'manual', 'feed_item'...
  source_id           uuid,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);

create index if not exists deliveries_user_idx
  on public.notification_deliveries (user_id, created_at desc);
create index if not exists deliveries_channel_idx
  on public.notification_deliveries (channel, created_at desc);
create index if not exists deliveries_status_idx
  on public.notification_deliveries (status, created_at desc);
create index if not exists deliveries_source_idx
  on public.notification_deliveries (source, source_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.notification_deliveries enable row level security;

-- Lecture: l'utilisateur voit ses propres envois, le dev voit tout.
drop policy if exists deliveries_select on public.notification_deliveries;
create policy deliveries_select on public.notification_deliveries
for select to authenticated
using (user_id = auth.uid() or public.is_dev());

-- Pas de policy d'écriture pour les rôles authentifiés.
-- Les inserts/updates passent UNIQUEMENT par le service-role (notify())
-- qui bypass la RLS.

grant select on public.notification_deliveries to authenticated;
