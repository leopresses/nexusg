-- ============================================
-- GOOGLE BUSINESS PROFILE INTEGRATION TABLES
-- ============================================

-- 1) Google User Connections (1 per user - stores OAuth tokens)
CREATE TABLE public.google_user_connections (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    google_email text,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'error', 'disconnected')),
    last_sync_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only owner can access their connection
CREATE POLICY "Users can view own google connection"
    ON public.google_user_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own google connection"
    ON public.google_user_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own google connection"
    ON public.google_user_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own google connection"
    ON public.google_user_connections FOR DELETE
    USING (auth.uid() = user_id);

-- 2) Client Google Locations (links a client to a Google Business location)
CREATE TABLE public.client_google_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    location_name text NOT NULL, -- Google location ID (e.g., locations/12345)
    location_title text NOT NULL, -- Human-readable name
    address text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(client_id) -- One location per client
);

-- Enable RLS
ALTER TABLE public.client_google_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only owner can access their client locations
CREATE POLICY "Users can view own client locations"
    ON public.client_google_locations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client locations"
    ON public.client_google_locations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client locations"
    ON public.client_google_locations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client locations"
    ON public.client_google_locations FOR DELETE
    USING (auth.uid() = user_id);

-- 3) Google Metrics Daily (daily snapshots of metrics)
CREATE TABLE public.google_metrics_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date date NOT NULL,
    views integer DEFAULT 0,
    calls integer DEFAULT 0,
    directions integer DEFAULT 0,
    website_clicks integer DEFAULT 0,
    messages integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, client_id, date) -- One snapshot per client per day
);

-- Enable RLS
ALTER TABLE public.google_metrics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only owner can access their metrics
CREATE POLICY "Users can view own metrics"
    ON public.google_metrics_daily FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
    ON public.google_metrics_daily FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
    ON public.google_metrics_daily FOR UPDATE
    USING (auth.uid() = user_id);

-- No delete policy - metrics are historical records

-- Indexes for performance
CREATE INDEX idx_google_metrics_user_client_date 
    ON public.google_metrics_daily(user_id, client_id, date);

CREATE INDEX idx_client_google_locations_client 
    ON public.client_google_locations(client_id);

CREATE INDEX idx_google_user_connections_status 
    ON public.google_user_connections(status);

-- Updated_at triggers
CREATE TRIGGER update_google_user_connections_updated_at
    BEFORE UPDATE ON public.google_user_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_google_locations_updated_at
    BEFORE UPDATE ON public.client_google_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();