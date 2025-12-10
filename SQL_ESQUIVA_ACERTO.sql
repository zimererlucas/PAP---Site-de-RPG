-- ============================================
-- ADICIONAR COLUNAS DE ESQUIVA E ACERTO
-- ============================================

-- Adicionar colunas de bonus para Esquiva e Acerto
ALTER TABLE public.personagens 
ADD COLUMN IF NOT EXISTS esquiva_bonus INTEGER DEFAULT 0;

ALTER TABLE public.personagens 
ADD COLUMN IF NOT EXISTS acerto_bonus INTEGER DEFAULT 0;

-- Inicializar valores existentes com 0
UPDATE public.personagens 
SET esquiva_bonus = 0 
WHERE esquiva_bonus IS NULL;

UPDATE public.personagens 
SET acerto_bonus = 0 
WHERE acerto_bonus IS NULL;
