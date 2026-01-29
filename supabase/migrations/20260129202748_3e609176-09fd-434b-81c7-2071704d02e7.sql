-- Create a SECURITY DEFINER function for admin plan updates
-- This restricts admin updates to only plan-related fields

CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  _user_id uuid,
  _plan subscription_plan,
  _clients_limit integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can update user plans';
  END IF;
  
  -- Validate inputs
  IF _clients_limit < 0 THEN
    RAISE EXCEPTION 'clients_limit cannot be negative';
  END IF;
  
  -- Update only plan-related fields
  UPDATE public.profiles
  SET 
    plan = _plan,
    clients_limit = _clients_limit,
    updated_at = now()
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_update_user_plan(uuid, subscription_plan, integer) TO authenticated;