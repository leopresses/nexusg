-- Fix: Update clients_limit based on plan
-- This function should be called when plan is updated to sync the limit

-- First, fix existing users to have correct limits based on their plan
UPDATE public.profiles
SET clients_limit = CASE 
    WHEN plan = 'starter' THEN 1
    WHEN plan = 'pro' THEN 3
    WHEN plan = 'elite' THEN 10
    WHEN plan = 'agency' THEN 999999  -- Effectively unlimited
END
WHERE clients_limit != CASE 
    WHEN plan = 'starter' THEN 1
    WHEN plan = 'pro' THEN 3
    WHEN plan = 'elite' THEN 10
    WHEN plan = 'agency' THEN 999999
END;

-- Create or replace function to sync clients_limit when plan changes
CREATE OR REPLACE FUNCTION public.sync_clients_limit_on_plan_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.clients_limit := CASE 
        WHEN NEW.plan = 'starter' THEN 1
        WHEN NEW.plan = 'pro' THEN 3
        WHEN NEW.plan = 'elite' THEN 10
        WHEN NEW.plan = 'agency' THEN 999999
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-sync limits
DROP TRIGGER IF EXISTS sync_clients_limit_trigger ON public.profiles;
CREATE TRIGGER sync_clients_limit_trigger
    BEFORE UPDATE OF plan ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_clients_limit_on_plan_change();

-- Update handle_new_user function to use correct limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile with starter plan
    INSERT INTO public.profiles (user_id, full_name, plan, clients_limit)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'starter',
        1  -- Starter = 1 client
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create default brand settings
    INSERT INTO public.brand_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$;