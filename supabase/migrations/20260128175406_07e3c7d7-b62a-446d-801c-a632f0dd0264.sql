-- ============================================================
-- SECURITY FIX: Add authorization to SECURITY DEFINER functions
-- and secure the brand-logos storage bucket
-- ============================================================

-- 1. FIX: generate_tasks_for_client - Add authorization check
-- This function should only be callable by the client owner or admins
CREATE OR REPLACE FUNCTION public.generate_tasks_for_client(_client_id uuid, _week_start date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    template RECORD;
    client_owner_id uuid;
BEGIN
    -- Authorization check: Get the client owner
    SELECT user_id INTO client_owner_id FROM clients WHERE id = _client_id;
    
    -- Verify caller has permission (owner or admin)
    IF auth.uid() IS NOT NULL AND 
       auth.uid() != client_owner_id AND 
       NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Not authorized to generate tasks for this client';
    END IF;

    -- Loop through all active templates
    FOR template IN 
        SELECT id, title, description, checklist 
        FROM task_templates 
        WHERE is_active = true
    LOOP
        -- Check if task already exists for this client, template, and week
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE client_id = _client_id 
            AND template_id = template.id 
            AND week_start = _week_start
        ) THEN
            -- Insert new task
            INSERT INTO tasks (client_id, template_id, title, description, checklist, week_start, status)
            VALUES (
                _client_id,
                template.id,
                template.title,
                template.description,
                template.checklist,
                _week_start,
                'pending'
            );
        END IF;
    END LOOP;
END;
$function$;

-- 2. FIX: sync_template_to_pending_tasks - Add admin-only check
-- Only admins can modify templates, so only admins should trigger sync
CREATE OR REPLACE FUNCTION public.sync_template_to_pending_tasks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Authorization check: Only admins can sync templates
    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Only administrators can modify task templates';
    END IF;

    -- Update all pending tasks that use this template
    UPDATE tasks
    SET 
        title = NEW.title,
        description = NEW.description,
        checklist = NEW.checklist,
        updated_at = now()
    WHERE template_id = NEW.id
    AND status = 'pending';
    
    RETURN NEW;
END;
$function$;

-- 3. FIX: on_client_created - Inherent protection via client RLS
-- This trigger runs when a new client is created. The client INSERT is already
-- protected by RLS (only user_id = auth.uid() can insert). We add an explicit
-- check to ensure the trigger was properly triggered by an authorized insert.
CREATE OR REPLACE FUNCTION public.on_client_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- The NEW.user_id should match the authenticated user
    -- This validates the insert was authorized via RLS
    IF auth.uid() IS NOT NULL AND NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot create client for another user';
    END IF;

    -- Generate tasks for the new client for the current week
    PERFORM generate_tasks_for_client(NEW.id, date_trunc('week', CURRENT_DATE)::date);
    RETURN NEW;
END;
$function$;

-- ============================================================
-- 4. STORAGE FIX: Make brand-logos bucket private
-- ============================================================

-- Update bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'brand-logos';

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;

-- Add authenticated-only SELECT policy for users to view their own logos
CREATE POLICY "Users can view own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text);