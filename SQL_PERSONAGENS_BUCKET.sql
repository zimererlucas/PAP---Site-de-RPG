-- 1. Cria o bucket 'personagens' para fotos de personagens se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('personagens', 'personagens', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Limpa políticas antigas caso já existissem (para evitar conflitos)
DROP POLICY IF EXISTS "Personagens Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Personagens Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Personagens User Update" ON storage.objects;
DROP POLICY IF EXISTS "Personagens User Delete" ON storage.objects;

-- 3. Política: Qualquer pessoa ("PUBLIC") pode VER (SELECT) os ficheiros no bucket 'personagens'
CREATE POLICY "Personagens Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'personagens' );

-- 4. Política: Utilizadores Autenticados podem fazer UPLOAD para 'personagens'
CREATE POLICY "Personagens Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'personagens' );

-- 5. Política: Utilizadores podem ATUALIZAR (UPDATE) apenas os próprios ficheiros no 'personagens'
CREATE POLICY "Personagens User Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'personagens' AND owner = auth.uid() );

-- 6. Política: Utilizadores podem APAGAR (DELETE) apenas os próprios ficheiros no 'personagens'
CREATE POLICY "Personagens User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'personagens' AND owner = auth.uid() );
