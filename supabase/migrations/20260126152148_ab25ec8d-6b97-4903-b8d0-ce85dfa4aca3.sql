
-- Function to generate tasks from templates for a specific client
CREATE OR REPLACE FUNCTION public.generate_tasks_for_client(_client_id uuid, _week_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    template RECORD;
BEGIN
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
$$;

-- Function to generate tasks for ALL active clients (called by cron)
CREATE OR REPLACE FUNCTION public.generate_weekly_tasks_for_all_clients()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client RECORD;
    current_week_start date;
BEGIN
    -- Calculate the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::date;
    
    -- Loop through all active clients
    FOR client IN SELECT id FROM clients WHERE is_active = true
    LOOP
        PERFORM generate_tasks_for_client(client.id, current_week_start);
    END LOOP;
END;
$$;

-- Trigger function to auto-generate tasks when a client is created
CREATE OR REPLACE FUNCTION public.on_client_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Generate tasks for the new client for the current week
    PERFORM generate_tasks_for_client(NEW.id, date_trunc('week', CURRENT_DATE)::date);
    RETURN NEW;
END;
$$;

-- Create the trigger on clients table
DROP TRIGGER IF EXISTS trigger_on_client_created ON clients;
CREATE TRIGGER trigger_on_client_created
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION on_client_created();

-- Function to sync template updates to pending tasks
CREATE OR REPLACE FUNCTION public.sync_template_to_pending_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Create trigger for template updates
DROP TRIGGER IF EXISTS trigger_sync_template_updates ON task_templates;
CREATE TRIGGER trigger_sync_template_updates
    AFTER UPDATE ON task_templates
    FOR EACH ROW
    EXECUTE FUNCTION sync_template_to_pending_tasks();
