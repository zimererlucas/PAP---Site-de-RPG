-- ============================================
-- ADICIONAR CAMPO DE BÔNUS ÀS TABELAS
-- =-==========================================

-- Adicionar coluna 'bonus' do tipo JSONB às tabelas relevantes
-- O tipo JSONB é eficiente para armazenar e consultar dados JSON.
-- O 'DEFAULT '[]'::jsonb' define um array JSON vazio como valor padrão.

ALTER TABLE magias ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;
ALTER TABLE habilidades ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;
ALTER TABLE conhecimentos ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;

-- Adicionar a coluna 'bonus' à tabela 'personagens' para as passivas
ALTER TABLE personagens ADD COLUMN IF NOT EXISTS passiva_bonus JSONB DEFAULT '[]'::jsonb;
