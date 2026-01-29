-- Add DELETE policy for google_metrics_daily table
-- This allows users to delete their own metrics data for compliance purposes

CREATE POLICY "Users can delete their own metrics"
ON public.google_metrics_daily
FOR DELETE
USING (auth.uid() = user_id);