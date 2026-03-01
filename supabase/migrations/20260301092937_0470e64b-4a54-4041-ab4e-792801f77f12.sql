
-- Ensure tracks bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('tracks', 'tracks', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Ensure screenshots bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Tracks bucket policies
CREATE POLICY "Authenticated users can read tracks"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tracks');

CREATE POLICY "Users can upload own tracks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tracks' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own tracks"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tracks' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own tracks"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tracks' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Screenshots bucket policies (financial data - restricted access)
CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'screenshots' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users and admins can view screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'screenshots' AND (
    (auth.uid())::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Users can delete own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'screenshots' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
