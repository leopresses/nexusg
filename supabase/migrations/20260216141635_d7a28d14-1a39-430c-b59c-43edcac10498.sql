
-- Create a trigger function to prevent non-admin users from modifying plan and clients_limit
CREATE OR REPLACE FUNCTION public.prevent_plan_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If plan or clients_limit is being changed, only allow admins
  IF (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.clients_limit IS DISTINCT FROM NEW.clients_limit) THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      -- Revert the sensitive fields to their original values
      NEW.plan := OLD.plan;
      NEW.clients_limit := OLD.clients_limit;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS enforce_plan_update_restriction ON public.profiles;
CREATE TRIGGER enforce_plan_update_restriction
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_self_update();
