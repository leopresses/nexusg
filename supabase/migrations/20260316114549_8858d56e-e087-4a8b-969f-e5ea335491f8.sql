-- Fix client_evidences INSERT policy
DROP POLICY "Users can insert own evidences" ON public.client_evidences;
CREATE POLICY "Users can insert own evidences" ON public.client_evidences
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.clients WHERE id = client_evidences.client_id AND clients.user_id = auth.uid())
  );

-- Fix client_onboarding INSERT policy
DROP POLICY "Users can insert own onboarding" ON public.client_onboarding;
CREATE POLICY "Users can insert own onboarding" ON public.client_onboarding
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.clients WHERE id = client_onboarding.client_id AND clients.user_id = auth.uid())
  );

-- Fix reports INSERT policy
DROP POLICY "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.clients WHERE id = reports.client_id AND clients.user_id = auth.uid())
  );