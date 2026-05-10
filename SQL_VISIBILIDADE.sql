-- Adicionar coluna 'is_public' à tabela personagens
ALTER TABLE personagens ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Adicionar coluna 'is_public' à tabela campanhas
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
