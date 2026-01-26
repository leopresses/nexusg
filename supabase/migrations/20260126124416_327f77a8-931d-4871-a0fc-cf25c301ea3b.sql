-- Drop the overly permissive notification insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more secure policy for notifications insert
-- Only authenticated users can insert notifications for themselves or system processes
CREATE POLICY "Users can receive notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Also allow admins to insert notifications for any user
CREATE POLICY "Admins can insert notifications for any user"
    ON public.notifications FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));