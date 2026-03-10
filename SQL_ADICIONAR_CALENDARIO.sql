-- ============================================
-- SQL: ADICIONAR SISTEMA DE CALENDÁRIO EM CAMPANHAS
-- ============================================

-- 1. ADICIONAR COLUNA DE DIA ATUAL NAS CAMPANHAS
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS dia_atual INTEGER DEFAULT 1;

-- 2. ADICIONAR COLUNA DE OBSERVAÇÕES DO CALENDÁRIO (JSON)
-- O formato será: { "1": "Resumo do dia 1", "2": "Resumo do dia 2" }
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS calendario_obs JSONB DEFAULT '{}';

-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN campanhas.dia_atual IS 'Contador de dias da campanha';
COMMENT ON COLUMN campanhas.calendario_obs IS 'Observações diárias da campanha em formato JSON';
