
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a controlled SECURITY DEFINER function for role management
CREATE OR REPLACE FUNCTION public.admin_manage_role(
  _target_user_id uuid,
  _role app_role,
  _operation text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Validate operation
  IF _operation NOT IN ('grant', 'revoke') THEN
    RAISE EXCEPTION 'Invalid operation. Use grant or revoke.';
  END IF;

  -- Prevent self-promotion/demotion
  IF auth.uid() = _target_user_id THEN
    RAISE EXCEPTION 'Cannot modify your own roles';
  END IF;

  IF _operation = 'grant' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF _operation = 'revoke' THEN
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role = _role;
  END IF;
END;
$$;
