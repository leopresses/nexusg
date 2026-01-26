-- Fix 1: Restrict task_templates visibility to admins and template creators only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "All users can view active templates" ON public.task_templates;

-- Create a new restrictive policy: only admins and creators can view templates
CREATE POLICY "Admins and creators can view templates"
  ON public.task_templates FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR (created_by = auth.uid())
  );

-- Fix 2: Add admin authorization check to generate_weekly_tasks_for_all_clients RPC
CREATE OR REPLACE FUNCTION public.generate_weekly_tasks_for_all_clients()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    client RECORD;
    current_week_start date;
BEGIN
    -- Authorization check: only admins can call this function
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Only administrators can generate tasks for all clients'
            USING HINT = 'Contact your administrator for access';
    END IF;
    
    -- Calculate the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::date;
    
    -- Loop through all active clients
    FOR client IN SELECT id FROM clients WHERE is_active = true
    LOOP
        PERFORM generate_tasks_for_client(client.id, current_week_start);
    END LOOP;
END;
$$;