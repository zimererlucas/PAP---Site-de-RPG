-- 1. Cria o bucket 'avatars' para fotos de perfil se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Limpa políticas antigas caso já existissem (para evitar conflitos)
DROP POLICY IF EXISTS "Avatars Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars User Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatars User Delete" ON storage.objects;

-- 3. Política: Qualquer pessoa ("PUBLIC") pode VER (SELECT) os ficheiros no bucket 'avatars'
CREATE POLICY "Avatars Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Política: Utilizadores Autenticados podem fazer UPLOAD para 'avatars'
CREATE POLICY "Avatars Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- 5. Política: Utilizadores podem ATUALIZAR (UPDATE) apenas os próprios ficheiros no 'avatars'
CREATE POLICY "Avatars User Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- 6. Política: Utilizadores podem APAGAR (DELETE) apenas os próprios ficheiros no 'avatars'
CREATE POLICY "Avatars User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );
