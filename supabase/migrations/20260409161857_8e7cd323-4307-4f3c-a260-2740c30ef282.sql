-- Add explicit UPDATE policy for evidences storage bucket
CREATE POLICY "Users can update own evidences files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidences'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);