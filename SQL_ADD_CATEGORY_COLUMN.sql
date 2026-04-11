-- Adicionar coluna 'categoria' à tabela capitulos_sistema
ALTER TABLE public.capitulos_sistema 
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Garantir que a ordem de exibição pode ser refinada
-- (Opcional) Podemos criar um índice para performance se houver muitos capítulos
CREATE INDEX IF NOT EXISTS idx_capitulos_categoria ON public.capitulos_sistema(categoria);
