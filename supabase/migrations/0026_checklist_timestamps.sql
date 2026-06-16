-- Add operator name and per-task timestamps to cashier checklists.
ALTER TABLE public.cashier_checklists
  ADD COLUMN IF NOT EXISTS operator_name text,
  ADD COLUMN IF NOT EXISTS completed_timestamps jsonb NOT NULL DEFAULT '{}';
