-- ============================================================
-- ATUALIZAÇÃO: CRIAR TABELA E POLÍTICAS RLS PARA ADMINS
-- Execute este ficheiro no SQL Editor do painel Supabase
-- ============================================================

-- 1. CRIAR TABELA DE CAPÍTULOS (Caso não exista)
CREATE TABLE IF NOT EXISTS public.capitulos_sistema (
    slug TEXT PRIMARY KEY,
    aba TEXT NOT NULL, -- 'rules' ou 'continents'
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABILITAR RLS
ALTER TABLE public.capitulos_sistema ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA capitulos_sistema
-- Todos podem ler capítulos
DROP POLICY IF EXISTS "Todos podem ler capítulos" ON public.capitulos_sistema;
CREATE POLICY "Todos podem ler capítulos" 
    ON public.capitulos_sistema FOR SELECT 
    USING (true);

-- Apenas admins podem gerir capítulos
DROP POLICY IF EXISTS "Admins podem gerir capítulos" ON public.capitulos_sistema;
CREATE POLICY "Admins podem gerir capítulos" 
    ON public.capitulos_sistema FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 4. POLÍTICAS PARA perfis (Gestão de Cargos)
-- Permitir que admins atualizem qualquer perfil
DROP POLICY IF EXISTS "Admins podem atualizar qualquer perfil" ON public.perfis;
CREATE POLICY "Admins podem atualizar qualquer perfil" 
    ON public.perfis FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Garantir que todos podem ler perfis
DROP POLICY IF EXISTS "Todos podem ler perfis" ON public.perfis;
CREATE POLICY "Todos podem ler perfis" 
    ON public.perfis FOR SELECT 
    USING (true);
