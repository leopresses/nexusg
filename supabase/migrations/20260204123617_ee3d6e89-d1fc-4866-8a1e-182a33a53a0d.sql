-- Add Place ID columns to clients table for Google Places integration
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS place_id text,
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS place_last_sync_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS place_snapshot jsonb DEFAULT '{}'::jsonb;

-- Create index for place_id lookups
CREATE INDEX IF NOT EXISTS idx_clients_place_id ON public.clients(place_id) WHERE place_id IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN public.clients.place_id IS 'Google Places API Place ID for the business';
COMMENT ON COLUMN public.clients.google_maps_url IS 'Google Maps URL for the business location';
COMMENT ON COLUMN public.clients.place_last_sync_at IS 'Last time place details were synced from Google Places API';
COMMENT ON COLUMN public.clients.place_snapshot IS 'Cached JSON data from Google Places Details API';