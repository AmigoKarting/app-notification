-- =====================================================================
--  Dispatch des rappels — colonnes de tracking + RPC de claim atomique
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colonnes additionnelles sur reminders
-- ---------------------------------------------------------------------
alter table public.reminders
  add column if not exists attempts         int          not null default 0,
  add column if not exists last_error       text,
  add column if not exists last_attempt_at  timestamptz,
  add column if not exists claimed_at       timestamptz;

-- Index spécifique au worker: ne scan que les rappels prêts à être envoyés
create index if not exists reminders_dispatch_idx
  on public.reminders (scheduled_at)
  where status = 'pending' and claimed_at is null;

-- ---------------------------------------------------------------------
-- RPC: claim atomique
--
-- Pourquoi un RPC plutôt qu'un UPDATE depuis le client JS:
-- on a besoin de FOR UPDATE SKIP LOCKED pour qu'un éventuel deuxième
-- worker concurrent ne re-prenne pas les mêmes lignes (cron qui se
-- chevauche, double instance Vercel...). PostgREST ne permet pas ça.
--
-- La fonction:
--  1) Sélectionne jusqu'à `batch_size` rappels prêts (scheduled_at <= now)
--     dont les tentatives sont sous le plafond, et dont le claim est
--     soit absent, soit périmé (worker crashé).
--  2) Les marque atomiquement: claimed_at = now, attempts += 1.
--  3) Retourne les lignes claimed.
-- ---------------------------------------------------------------------
create or replace function public.claim_due_reminders(
  batch_size           int default 50,
  max_attempts         int default 5,
  stale_after_minutes  int default 15
)
returns setof public.reminders
language plpgsql
as $$
declare
  stale_cutoff timestamptz := now() - make_interval(mins => stale_after_minutes);
begin
  return query
  with eligible as (
    select id
    from public.reminders
    where status = 'pending'
      and scheduled_at <= now()
      and attempts < max_attempts
      and (claimed_at is null or claimed_at < stale_cutoff)
    order by scheduled_at asc
    limit batch_size
    for update skip locked
  )
  update public.reminders r
     set claimed_at      = now(),
         last_attempt_at = now(),
         attempts        = r.attempts + 1
    from eligible
   where r.id = eligible.id
  returning r.*;
end;
$$;

-- Verrouille l'accès: seul le rôle service_role (cron) peut claim.
revoke all on function public.claim_due_reminders(int, int, int) from public, anon, authenticated;
grant execute on function public.claim_due_reminders(int, int, int) to service_role;
