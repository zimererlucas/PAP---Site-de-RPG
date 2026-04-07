-- ============================================================
-- ATUALIZAÇÃO: ADICIONAR CARGO DE ADMINISTRADOR
-- Execute este ficheiro no SQL Editor do painel Supabase
-- ============================================================

-- Adiciona a coluna is_admin à tabela perfis com o valor padrão FALSE (usuário normal).
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Exemplo: Para promover um usuário específico a administrador, você pode usar:
-- UPDATE perfis SET is_admin = TRUE WHERE username = 'NomeDoSeuAdmin';
-- OU pelo supabase dashboard (Table Editor -> Perfis -> Editar linha -> is_admin).
