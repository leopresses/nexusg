
-- Make client-avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'client-avatars';

-- Drop the open SELECT policy
DROP POLICY IF EXISTS "Client avatars are publicly viewable" ON storage.objects;

-- Create authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view client avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-avatars');
