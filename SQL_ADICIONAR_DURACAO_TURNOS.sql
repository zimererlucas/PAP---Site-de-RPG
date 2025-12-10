-- ============================================
-- ADICIONAR CAMPOS DE DURAÇÃO DE TURNOS
-- ============================================
-- Este script adiciona os campos necessários para o sistema de duração de turnos
-- em magias, habilidades e inventário

-- ============================================
-- TABELA: magias
-- ============================================

-- Campo que define quantos turnos a magia dura (configurado ao criar/editar)
ALTER TABLE magias 
ADD COLUMN IF NOT EXISTS duracao_turnos INTEGER DEFAULT NULL;

-- Campo que guarda em qual turno da campanha foi ativado
ALTER TABLE magias 
ADD COLUMN IF NOT EXISTS turno_ativacao INTEGER DEFAULT NULL;

-- Campo que guarda quantos turnos ainda restam (decrementado a cada turno)
ALTER TABLE magias 
ADD COLUMN IF NOT EXISTS turnos_restantes INTEGER DEFAULT NULL;

-- Campo que marca quando foi desativada
ALTER TABLE magias 
ADD COLUMN IF NOT EXISTS deativada_em TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- TABELA: habilidades
-- ============================================

-- Campo que define quantos turnos a habilidade dura (configurado ao criar/editar)
ALTER TABLE habilidades 
ADD COLUMN IF NOT EXISTS duracao_turnos INTEGER DEFAULT NULL;

-- Campo que guarda em qual turno da campanha foi ativado
ALTER TABLE habilidades 
ADD COLUMN IF NOT EXISTS turno_ativacao INTEGER DEFAULT NULL;

-- Campo que guarda quantos turnos ainda restam (decrementado a cada turno)
ALTER TABLE habilidades 
ADD COLUMN IF NOT EXISTS turnos_restantes INTEGER DEFAULT NULL;

-- Campo que marca quando foi desativada
ALTER TABLE habilidades 
ADD COLUMN IF NOT EXISTS deativada_em TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- TABELA: inventario
-- ============================================

-- Campo que define quantos turnos o item dura (configurado ao criar/editar)
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS duracao_turnos INTEGER DEFAULT NULL;

-- Campo que guarda em qual turno da campanha foi ativado
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS turno_ativacao INTEGER DEFAULT NULL;

-- Campo que guarda quantos turnos ainda restam (decrementado a cada turno)
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS turnos_restantes INTEGER DEFAULT NULL;

-- Campo que marca quando foi desativada
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS deativada_em TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN magias.duracao_turnos IS 'Duração da magia em turnos quando ativada. NULL = sem duração limitada';
COMMENT ON COLUMN magias.turno_ativacao IS 'Número do turno da campanha em que foi ativada';
COMMENT ON COLUMN magias.turnos_restantes IS 'Quantos turnos ainda restam até expirar';
COMMENT ON COLUMN magias.deativada_em IS 'Timestamp de quando foi desativada';

COMMENT ON COLUMN habilidades.duracao_turnos IS 'Duração da habilidade em turnos quando ativada. NULL = sem duração limitada';
COMMENT ON COLUMN habilidades.turno_ativacao IS 'Número do turno da campanha em que foi ativada';
COMMENT ON COLUMN habilidades.turnos_restantes IS 'Quantos turnos ainda restam até expirar';
COMMENT ON COLUMN habilidades.deativada_em IS 'Timestamp de quando foi desativada';

COMMENT ON COLUMN inventario.duracao_turnos IS 'Duração do item em turnos quando ativado. NULL = sem duração limitada';
COMMENT ON COLUMN inventario.turno_ativacao IS 'Número do turno da campanha em que foi ativado';
COMMENT ON COLUMN inventario.turnos_restantes IS 'Quantos turnos ainda restam até expirar';
COMMENT ON COLUMN inventario.deativada_em IS 'Timestamp de quando foi desativado';

-- ============================================
-- NOTAS DE USO:
-- ============================================
-- 1. duracao_turnos: Define quantos turnos o efeito dura (ex: 3)
--    - Configurado ao criar/editar o item
--    - NULL = sem duração limitada (permanente)
--
-- 2. turno_ativacao: Marca em qual turno foi ativado
--    - Preenchido automaticamente ao ativar
--    - Usado para calcular se deve decrementar
--
-- 3. turnos_restantes: Contador regressivo
--    - Copiado de duracao_turnos ao ativar
--    - Decrementado a cada turno que passa
--    - Quando chega a 0, item é desativado automaticamente
--
-- 4. deativada_em: Timestamp de desativação
--    - Para histórico/auditoria
