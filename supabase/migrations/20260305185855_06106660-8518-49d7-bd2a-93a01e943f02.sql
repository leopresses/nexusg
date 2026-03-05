-- Create a dedicated private bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own reports
CREATE POLICY "Users can upload own reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can view their own reports
CREATE POLICY "Users can view own reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can delete their own reports
CREATE POLICY "Users can delete own reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);