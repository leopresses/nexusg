-- ============================================================
-- MIGRATION: Daily Tasks, Client Segmentation, Custom Tasks, Reports Persistence
-- ============================================================

-- 1) Create enum for task frequency
CREATE TYPE public.task_frequency AS ENUM ('daily', 'weekly');

-- 2) Create enum for extended client types (normalize existing business_type)
-- We'll extend the existing business_type enum to add new types
ALTER TYPE public.business_type ADD VALUE IF NOT EXISTS 'cafe_service';
ALTER TYPE public.business_type ADD VALUE IF NOT EXISTS 'barbershop_salon';

-- 3) Add new columns to task_templates table
ALTER TABLE public.task_templates 
ADD COLUMN IF NOT EXISTS frequency public.task_frequency DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS target_client_types public.business_type[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4) Add new columns to tasks table for daily tracking
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS frequency public.task_frequency DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS task_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- 5) Add client avatar column
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- 6) Create reports table for persistent storage
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    file_url TEXT DEFAULT NULL,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7) Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 8) RLS policies for reports - Users can only see and manage their own reports
CREATE POLICY "Users can view own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
ON public.reports
FOR DELETE
USING (auth.uid() = user_id);

-- 9) Create user_preferences table for sound settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10) Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 11) RLS policies for user_preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- 12) Create storage bucket for client avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 13) Storage policies for client avatars
CREATE POLICY "Users can upload own client avatars"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own client avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own client avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Client avatars are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'client-avatars');

-- 14) Update trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 15) Create function to generate daily tasks for a client
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_for_client(_client_id uuid, _task_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    
    -- Authorization check
    IF auth.uid() IS NOT NULL AND 
       auth.uid() != client_owner_id AND 
       NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
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
$$;

-- 16) Update generate_tasks_for_client to respect client types
CREATE OR REPLACE FUNCTION public.generate_tasks_for_client(_client_id uuid, _week_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    template RECORD;
    client_record RECORD;
    client_owner_id uuid;
BEGIN
    -- Get client info
    SELECT user_id, business_type INTO client_record FROM clients WHERE id = _client_id;
    client_owner_id := client_record.user_id;
    
    -- Authorization check: Get the client owner
    IF auth.uid() IS NOT NULL AND 
       auth.uid() != client_owner_id AND 
       NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
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
$$;

-- 17) Function to generate daily tasks for all clients (can be scheduled)
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_for_all_clients()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    client RECORD;
BEGIN
    -- Authorization check: only admins can call this function
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Only administrators can generate tasks for all clients'
            USING HINT = 'Contact your administrator for access';
    END IF;
    
    -- Loop through all active clients
    FOR client IN SELECT id FROM clients WHERE is_active = true
    LOOP
        PERFORM generate_daily_tasks_for_client(client.id, CURRENT_DATE);
    END LOOP;
END;
$$;

-- 18) Create index for efficient daily task queries
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON public.tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_frequency ON public.tasks(frequency);
CREATE INDEX IF NOT EXISTS idx_task_templates_frequency ON public.task_templates(frequency);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);