
-- Update generate_tasks_for_client to be smarter about Google sync status
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
    has_google boolean;
BEGIN
    -- Get client info including Google sync status
    SELECT user_id, business_type, place_id INTO client_record FROM clients WHERE id = _client_id;
    client_owner_id := client_record.user_id;
    
    -- Strict authorization: only the client owner can generate tasks
    IF auth.uid() IS NULL OR auth.uid() != client_owner_id THEN
        RAISE EXCEPTION 'Not authorized to generate tasks for this client';
    END IF;

    -- Determine if client has Google synced
    has_google := (client_record.place_id IS NOT NULL AND client_record.place_id != '');

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
    
    -- If NO Google synced, add essential fallback tasks (only if they don't exist yet)
    IF NOT has_google THEN
        -- Fallback: Complete Google profile
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE client_id = _client_id 
            AND week_start = _week_start 
            AND title = 'Completar perfil do Google'
            AND is_custom = true
        ) THEN
            INSERT INTO tasks (client_id, title, description, checklist, week_start, status, frequency, is_custom)
            VALUES (
                _client_id,
                'Completar perfil do Google',
                'Vincule o Place ID do cliente e sincronize dados públicos do Google.',
                '[{"id":"1","text":"Buscar Place ID do negócio","completed":false},{"id":"2","text":"Vincular Place ID no sistema","completed":false},{"id":"3","text":"Sincronizar dados do Google","completed":false}]'::jsonb,
                _week_start,
                'pending',
                'weekly',
                true
            );
        END IF;

        -- Fallback: Add photos
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE client_id = _client_id 
            AND week_start = _week_start 
            AND title = 'Adicionar fotos ao perfil'
            AND is_custom = true
        ) THEN
            INSERT INTO tasks (client_id, title, description, checklist, week_start, status, frequency, is_custom)
            VALUES (
                _client_id,
                'Adicionar fotos ao perfil',
                'Adicione 5-10 fotos de qualidade ao perfil do Google do cliente.',
                '[{"id":"1","text":"Foto da fachada","completed":false},{"id":"2","text":"Fotos do interior","completed":false},{"id":"3","text":"Fotos de produtos/serviços","completed":false},{"id":"4","text":"Foto da equipe","completed":false}]'::jsonb,
                _week_start,
                'pending',
                'weekly',
                true
            );
        END IF;
    END IF;
    
    -- Also generate daily tasks for today
    PERFORM generate_daily_tasks_for_client(_client_id, CURRENT_DATE);
END;
$function$;
