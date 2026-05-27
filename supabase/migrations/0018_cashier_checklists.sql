-- Cashier daily task checklists (idempotent: safe to re-run).
CREATE TABLE IF NOT EXISTS public.cashier_checklists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_items text[] NOT NULL DEFAULT '{}',
  total_items   int NOT NULL,
  notes         text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashier_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cashiers insert own checklists" ON public.cashier_checklists;
CREATE POLICY "Cashiers insert own checklists"
  ON public.cashier_checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cashiers view own checklists" ON public.cashier_checklists;
CREATE POLICY "Cashiers view own checklists"
  ON public.cashier_checklists FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('gerant', 'dev')
    )
  );
