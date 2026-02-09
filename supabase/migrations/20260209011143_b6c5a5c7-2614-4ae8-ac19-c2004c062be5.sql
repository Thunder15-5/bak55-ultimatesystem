-- Drop and recreate the covers upload policy to allow any authenticated user
DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;

CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers');

-- Also update the update and delete policies for authenticated users
DROP POLICY IF EXISTS "Users can update own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own covers" ON storage.objects;

CREATE POLICY "Authenticated users can update covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can delete own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND (auth.uid())::text = (storage.foldername(name))[1]);