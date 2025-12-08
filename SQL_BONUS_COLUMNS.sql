-- ============================================
-- ADICIONAR COLUNAS DE BONUS PARA STATUS
-- ============================================

-- Adicionar colunas de bonus se não existirem
ALTER TABLE public.personagens 
ADD COLUMN IF NOT EXISTS vida_maxima_bonus INTEGER DEFAULT 0;

ALTER TABLE public.personagens 
ADD COLUMN IF NOT EXISTS mana_maxima_bonus INTEGER DEFAULT 0;

ALTER TABLE public.personagens 
ADD COLUMN IF NOT EXISTS estamina_maxima_bonus INTEGER DEFAULT 0;

-- Inicializar valores existentes com 0
UPDATE public.personagens 
SET vida_maxima_bonus = 0 
WHERE vida_maxima_bonus IS NULL;

UPDATE public.personagens 
SET mana_maxima_bonus = 0 
WHERE mana_maxima_bonus IS NULL;

UPDATE public.personagens 
SET estamina_maxima_bonus = 0 
WHERE estamina_maxima_bonus IS NULL;
