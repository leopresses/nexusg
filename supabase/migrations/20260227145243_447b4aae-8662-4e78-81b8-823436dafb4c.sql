
CREATE TABLE public.client_onboarding (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  steps jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding" ON public.client_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.client_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.client_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding" ON public.client_onboarding
  FOR DELETE USING (auth.uid() = user_id);
