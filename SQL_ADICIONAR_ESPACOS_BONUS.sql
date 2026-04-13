-- Adiciona a coluna espacos_bonus na tabela de personagens para permitir alteração do limite máximo
ALTER TABLE public.personagens ADD COLUMN IF NOT EXISTS espacos_bonus integer DEFAULT 0;
