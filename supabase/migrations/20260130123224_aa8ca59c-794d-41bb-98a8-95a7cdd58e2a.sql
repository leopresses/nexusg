-- Add 'tatico' to the subscription_plan enum
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'tatico';

-- Update the sync_clients_limit_on_plan_change function with new plan limits
CREATE OR REPLACE FUNCTION public.sync_clients_limit_on_plan_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.clients_limit := CASE 
        WHEN NEW.plan = 'starter' THEN 1
        WHEN NEW.plan = 'tatico' THEN 3
        WHEN NEW.plan = 'pro' THEN 6
        WHEN NEW.plan = 'elite' THEN 10
        WHEN NEW.plan = 'agency' THEN 999999
        ELSE 1
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;