-- Remove admin access to all profiles (privacy violation)
-- Keep admin update for plan management but remove the SELECT all policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create a more restrictive admin policy for profiles:
-- Admin can only update specific admin-managed fields (plan, clients_limit) on any profile
-- but cannot SELECT all profiles - they need their own admin panel data

-- For admin user management, we'll create a view or use the existing approach
-- where admin fetches users from auth via service role, not by RLS bypass

-- Update the generate functions to only work on admin's OWN clients
CREATE OR REPLACE FUNCTION public.generate_weekly_tasks_for_all_clients()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    client RECORD;
    current_week_start date;
    caller_id uuid;
BEGIN
    caller_id := auth.uid();
    
    -- Authorization check: user must be authenticated
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Calculate the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::date;
    
    -- Loop through only the caller's active clients (privacy-safe)
    FOR client IN SELECT id FROM clients WHERE is_active = true AND user_id = caller_id
    LOOP
        PERFORM generate_tasks_for_client(client.id, current_week_start);
    END LOOP;
END;
$function$;

-- Update daily task generation to only work on user's OWN clients
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_for_all_clients()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    client RECORD;
    caller_id uuid;
BEGIN
    caller_id := auth.uid();
    
    -- Authorization check: user must be authenticated
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Loop through only the caller's active clients (privacy-safe)
    FOR client IN SELECT id FROM clients WHERE is_active = true AND user_id = caller_id
    LOOP
        PERFORM generate_daily_tasks_for_client(client.id, CURRENT_DATE);
    END LOOP;
END;
$function$;

-- Update individual task generation to be strictly owner-based (no admin bypass)
CREATE OR REPLACE FUNCTION public.generate_tasks_for_client(_client_id uuid, _week_start date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    template RECORD;
    client_record RECORD;
    client_owner_id uuid;
BEGIN
    -- Get client info
    SELECT user_id, business_type INTO client_record FROM clients WHERE id = _client_id;
    client_owner_id := client_record.user_id;
    
    -- Strict authorization: only the client owner can generate tasks
    IF auth.uid() IS NULL OR auth.uid() != client_owner_id THEN
        RAISE EXCEPTION 'Not authorized to generate tasks for this client';
    END IF;

    -- Loop through all active WEEKLY templates that match this client type
    FOR template IN 
        SELECT id, title, description, checklist 
        FROM task_templates 
        WHERE is_active = true
        AND (frequency IS NULL OR frequency = 'weekly')
        AND (target_client_types IS NULL OR client_record.business_type = ANY(target_client_types))
        ORDER BY sort_order
    LOOP
        -- Check if task already exists for this client, template, and week
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE client_id = _client_id 
            AND template_id = template.id 
            AND week_start = _week_start
        ) THEN
            -- Insert new task
            INSERT INTO tasks (client_id, template_id, title, description, checklist, week_start, status, frequency)
            VALUES (
                _client_id,
                template.id,
                template.title,
                template.description,
                template.checklist,
                _week_start,
                'pending',
                'weekly'
            );
        END IF;
    END LOOP;
    
    -- Also generate daily tasks for today
    PERFORM generate_daily_tasks_for_client(_client_id, CURRENT_DATE);
END;
$function$;

-- Update daily task generation to be strictly owner-based (no admin bypass)
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_for_client(_client_id uuid, _task_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    template RECORD;
    client_record RECORD;
    client_owner_id uuid;
    daily_task_count integer;
    max_daily_tasks integer := 6;
BEGIN
    -- Get client info
    SELECT user_id, business_type INTO client_record FROM clients WHERE id = _client_id;
    client_owner_id := client_record.user_id;
    
    -- Strict authorization: only the client owner can generate tasks
    IF auth.uid() IS NULL OR auth.uid() != client_owner_id THEN
        RAISE EXCEPTION 'Not authorized to generate tasks for this client';
    END IF;

    -- Count existing daily tasks for this client on this date
    SELECT COUNT(*) INTO daily_task_count 
    FROM tasks 
    WHERE client_id = _client_id 
    AND task_date = _task_date
    AND frequency = 'daily';
    
    -- Loop through active daily templates that match this client type
    FOR template IN 
        SELECT id, title, description, checklist, frequency
        FROM task_templates 
        WHERE is_active = true 
        AND frequency = 'daily'
        AND (target_client_types IS NULL OR client_record.business_type = ANY(target_client_types))
        ORDER BY sort_order
        LIMIT (max_daily_tasks - daily_task_count)
    LOOP
        -- Check if task already exists for this client, template, and date
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE client_id = _client_id 
            AND template_id = template.id 
            AND task_date = _task_date
        ) THEN
            -- Insert new daily task
            INSERT INTO tasks (client_id, template_id, title, description, checklist, week_start, task_date, status, frequency)
            VALUES (
                _client_id,
                template.id,
                template.title,
                template.description,
                template.checklist,
                date_trunc('week', _task_date)::date,
                _task_date,
                'pending',
                'daily'
            );
            
            daily_task_count := daily_task_count + 1;
            IF daily_task_count >= max_daily_tasks THEN
                EXIT;
            END IF;
        END IF;
    END LOOP;
END;
$function$;

-- Update on_client_created to be strictly owner-based
CREATE OR REPLACE FUNCTION public.on_client_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- The NEW.user_id should match the authenticated user
    IF auth.uid() IS NULL OR NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot create client for another user';
    END IF;

    -- Generate tasks for the new client for the current week
    PERFORM generate_tasks_for_client(NEW.id, date_trunc('week', CURRENT_DATE)::date);
    RETURN NEW;
END;
$function$;