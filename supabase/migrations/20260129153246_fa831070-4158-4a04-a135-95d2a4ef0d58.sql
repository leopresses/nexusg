-- Remove admin policies that grant access to other users' private data
-- This ensures privacy/LGPD compliance by restricting admins to their own data

-- Remove admin access to all clients (privacy violation)
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;

-- Remove admin access to all tasks (privacy violation)
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;