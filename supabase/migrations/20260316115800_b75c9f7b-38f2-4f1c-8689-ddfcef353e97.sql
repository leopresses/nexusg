
-- Ensure prevent_plan_self_update function is tracked in migrations
CREATE OR REPLACE FUNCTION public.prevent_plan_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.clients_limit IS DISTINCT FROM NEW.clients_limit) THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.plan := OLD.plan;
      NEW.clients_limit := OLD.clients_limit;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS prevent_plan_self_update ON public.profiles;
CREATE TRIGGER prevent_plan_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_self_update();

-- Harden the user UPDATE policy with a WITH CHECK clause
-- that prevents non-admins from changing plan or clients_limit
DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Either user is admin (can change anything)
      has_role(auth.uid(), 'admin'::app_role)
      OR (
        -- Non-admin: plan and clients_limit must remain unchanged
        plan = (SELECT p.plan FROM public.profiles p WHERE p.user_id = auth.uid())
        AND clients_limit = (SELECT p.clients_limit FROM public.profiles p WHERE p.user_id = auth.uid())
      )
    )
  );
