CREATE OR REPLACE FUNCTION public.prevent_plan_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.clients_limit IS DISTINCT FROM NEW.clients_limit) THEN
    IF auth.role() = 'service_role' THEN
      RETURN NEW;
    END IF;

    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.plan := OLD.plan;
      NEW.clients_limit := OLD.clients_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_plan_self_update_on_profiles ON public.profiles;
CREATE TRIGGER prevent_plan_self_update_on_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_plan_self_update();

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "No direct role assignment"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct role modification"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct role deletion"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);