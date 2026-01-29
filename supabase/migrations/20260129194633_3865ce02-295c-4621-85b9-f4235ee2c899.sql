-- ============================================================
-- Make client-avatars bucket private and fix SELECT policy
-- ============================================================

-- Update bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'client-avatars';

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Client avatars are publicly viewable" ON storage.objects;

-- Add authenticated-only SELECT policy for users to view their own client avatars
CREATE POLICY "Users can view own client avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);