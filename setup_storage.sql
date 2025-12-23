-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated uploads (or just public for this simple project)
-- For this project, we'll allow all uploads to the avatars bucket for simplicity
-- since we don't have complex auth in this local dev environment.
CREATE POLICY "Allow Public Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' );

-- 4. Allow updates
CREATE POLICY "Allow Public Updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' );
