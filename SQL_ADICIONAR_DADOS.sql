-- ============================================
-- ADICIONAR SISTEMA DE DADOS (DICE ROLLS)
-- ============================================

-- Adicionar coluna 'dados' às tabelas de magias, habilidades, conhecimentos e inventário
-- Estrutura: JSON com array de dados { quantidade: number, lados: number }[]

ALTER TABLE magias ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE habilidades ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE conhecimentos ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_magias_dados ON magias USING GIN (dados);
CREATE INDEX IF NOT EXISTS idx_habilidades_dados ON habilidades USING GIN (dados);
CREATE INDEX IF NOT EXISTS idx_conhecimentos_dados ON conhecimentos USING GIN (dados);
CREATE INDEX IF NOT EXISTS idx_inventario_dados ON inventario USING GIN (dados);

-- Exemplos de dados válidos:
-- Magia com 2d20 + 1d50: {"dados": [{"quantidade": 2, "lados": 20}, {"quantidade": 1, "lados": 50}]}
-- Habilidade com 1d100: {"dados": [{"quantidade": 1, "lados": 100}]}
-- Item com 3d8: {"dados": [{"quantidade": 3, "lados": 8}]}
