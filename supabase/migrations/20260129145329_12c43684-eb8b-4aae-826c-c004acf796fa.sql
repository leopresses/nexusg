-- Add UPDATE policy for reports table to allow users to update their own reports
CREATE POLICY "Users can update own reports"
ON public.reports
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);