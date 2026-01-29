-- Re-add restrictive admin policies for profile management only (not SELECT all)
-- Admin can update profiles (for plan management) but needs proper auth flow

-- Create a policy that allows admins to update any profile (for plan management)
CREATE POLICY "Admins can update profiles for plan management"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));