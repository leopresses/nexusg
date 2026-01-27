-- Add INSERT policy for brand_settings table
-- This allows users to create their own brand settings

CREATE POLICY "Users can insert own brand settings"
  ON public.brand_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);