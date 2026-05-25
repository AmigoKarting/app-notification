-- Cashier daily task checklists
CREATE TABLE public.cashier_checklists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_items text[] NOT NULL DEFAULT '{}',
  total_items   int NOT NULL,
  notes         text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashier_checklists ENABLE ROW LEVEL SECURITY;

-- Cashiers can insert their own checklists
CREATE POLICY "Cashiers insert own checklists"
  ON public.cashier_checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Cashiers can view their own checklists
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
