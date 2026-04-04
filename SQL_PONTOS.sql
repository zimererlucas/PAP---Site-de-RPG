-- Adicionar colunas de pontos à tabela personagens
ALTER TABLE public.personagens
ADD COLUMN IF NOT EXISTS ponto_bloqueio   integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ponto_reacao     integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ponto_destino    integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ponto_treinamento integer NOT NULL DEFAULT 0;
