-- ============================================
-- ALTERAR CAMPOS ALTURA E PESO PARA TEXTO
-- ============================================

-- Isso permite que o usuário digite "180cm" ou "80kg" em vez de apenas números.

ALTER TABLE personagens 
ALTER COLUMN altura TYPE TEXT;

ALTER TABLE personagens 
ALTER COLUMN peso TYPE TEXT;
