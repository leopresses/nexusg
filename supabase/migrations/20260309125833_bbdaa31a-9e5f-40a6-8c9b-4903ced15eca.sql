-- Make client-avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'client-avatars';

-- Drop all existing policies for client-avatars
DROP POLICY IF EXISTS "Client avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete client avatars" ON storage.objects;

-- Recreate owner-scoped policies
CREATE POLICY "Users can view own client avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload client avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update client avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete client avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);