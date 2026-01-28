-- Add explicit INSERT policy for task_templates to restrict template creation to admins only
-- This prevents regular users from inserting templates even if they bypass the application layer

CREATE POLICY "Only admins can insert templates"
  ON public.task_templates
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));