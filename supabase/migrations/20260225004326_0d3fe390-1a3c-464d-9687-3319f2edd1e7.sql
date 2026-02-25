-- Fix daily task limit from 6 to 3
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
    max_daily_tasks integer := 3;
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