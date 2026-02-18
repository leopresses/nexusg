
-- Add support_whatsapp column to brand_settings
ALTER TABLE public.brand_settings ADD COLUMN IF NOT EXISTS support_whatsapp text DEFAULT NULL;

-- Ensure storage policies exist for brand-logos bucket
-- Allow authenticated users to upload their own logos
DO $$
BEGIN
  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload brand logos'
  ) THEN
    CREATE POLICY "Users can upload brand logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can view own brand logos'
  ) THEN
    CREATE POLICY "Users can view own brand logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update own brand logos'
  ) THEN
    CREATE POLICY "Users can update own brand logos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete own brand logos'
  ) THEN
    CREATE POLICY "Users can delete own brand logos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
