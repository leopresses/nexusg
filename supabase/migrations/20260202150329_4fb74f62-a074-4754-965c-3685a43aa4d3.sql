-- Add Google Business Profile fields to clients table for the new architecture
-- Each client can be linked to a specific GBP account/location

-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS gbp_account_id text,
ADD COLUMN IF NOT EXISTS gbp_location_id text,
ADD COLUMN IF NOT EXISTS gbp_location_name text,
ADD COLUMN IF NOT EXISTS gbp_address text,
ADD COLUMN IF NOT EXISTS google_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_gbp_sync_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS gbp_sync_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS gbp_sync_error text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_google_connected ON public.clients(google_connected) WHERE google_connected = true;
CREATE INDEX IF NOT EXISTS idx_clients_gbp_location ON public.clients(gbp_location_id) WHERE gbp_location_id IS NOT NULL;

-- Add unique constraint to prevent duplicate location links (one location per client)
-- But allow the same location to be linked to multiple clients (for franchises, etc.)

-- Create a composite unique index on user_id + client + location to enforce user-level uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_location_unique 
ON public.clients(user_id, gbp_location_id) 
WHERE gbp_location_id IS NOT NULL;

-- Update google_user_connections to add is_active and last_error for better tracking
ALTER TABLE public.google_user_connections
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS scopes text;

-- Comment on columns for documentation
COMMENT ON COLUMN public.clients.gbp_account_id IS 'Google Business Profile account ID (e.g., accounts/123456)';
COMMENT ON COLUMN public.clients.gbp_location_id IS 'Google Business Profile location ID (e.g., locations/789012)';
COMMENT ON COLUMN public.clients.gbp_location_name IS 'Full GBP location name for API calls (e.g., accounts/123/locations/789)';
COMMENT ON COLUMN public.clients.google_connected IS 'Whether this client has a linked Google Business location';
COMMENT ON COLUMN public.clients.last_gbp_sync_at IS 'Last successful metrics sync timestamp';
COMMENT ON COLUMN public.clients.gbp_sync_status IS 'Current sync status: pending, syncing, success, error';
COMMENT ON COLUMN public.clients.gbp_sync_error IS 'Last sync error message if any';