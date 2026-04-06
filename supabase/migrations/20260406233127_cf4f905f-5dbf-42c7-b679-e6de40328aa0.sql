DROP POLICY "Users can insert own client locations" ON public.client_google_locations;

CREATE POLICY "Users can insert own client locations"
ON public.client_google_locations FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_google_locations.client_id
      AND clients.user_id = auth.uid()
  )
);