
-- 1. Create the 'fichas' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('fichas', 'fichas', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts (optional, but safer for cleaner setup)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "User Update" ON storage.objects;
DROP POLICY IF EXISTS "User Delete" ON storage.objects;

-- 3. Policy: Allow PUBLIC (anyone) to VIEW files in 'fichas'
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'fichas' );

-- 4. Policy: Allow AUTHENTICATED users to UPLOAD files to 'fichas'
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'fichas' );

-- 5. Policy: Allow Users to UPDATE their own files
CREATE POLICY "User Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'fichas' AND owner = auth.uid() );

-- 6. Policy: Allow Users to DELETE their own files
CREATE POLICY "User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'fichas' AND owner = auth.uid() );
