-- ============================================
-- ADICIONAR COLUNA BONUS NAS TABELAS
-- ============================================

-- 1. ADICIONAR COLUNA BONUS NAS MAGIAS
ALTER TABLE magias ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;

-- 2. ADICIONAR COLUNA BONUS NAS HABILIDADES
ALTER TABLE habilidades ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;

-- 3. ADICIONAR COLUNA BONUS NOS CONHECIMENTOS
ALTER TABLE conhecimentos ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;

-- 4. ADICIONAR COLUNA BONUS NO INVENTÁRIO (ITENS)
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS bonus JSONB DEFAULT '[]'::jsonb;

-- 5. ADICIONAR COLUNAS DE BONUS PARA VIDA, MANA E ESTAMINA
ALTER TABLE personagens ADD COLUMN IF NOT EXISTS vida_maxima_bonus INT DEFAULT 0;
ALTER TABLE personagens ADD COLUMN IF NOT EXISTS mana_maxima_bonus INT DEFAULT 0;
ALTER TABLE personagens ADD COLUMN IF NOT EXISTS estamina_maxima_bonus INT DEFAULT 0;

-- Nota: As passivas são armazenadas como JSONB na coluna 'passiva' da tabela personagens,
-- então não precisam de alterações na estrutura do banco de dados.

-- ============================================
-- ESTRUTURA DO BONUS (JSON)
-- ============================================
-- Exemplo de como os bônus são armazenados:
-- {
--   "bonus": [
--     {
--       "atributo": "forca_bonus",
--       "valor": 2
--     },
--     {
--       "atributo": "agilidade_bonus",
--       "valor": 1
--     }
--   ]
-- }
--
-- Os atributos disponíveis são:
-- - forca_bonus
-- - agilidade_bonus
-- - sorte_bonus
-- - inteligencia_bonus
-- - corpo_essencia_bonus
-- - exposicao_runica_bonus
-- - vida_maxima_bonus
-- - mana_maxima_bonus
-- - estamina_maxima_bonus
