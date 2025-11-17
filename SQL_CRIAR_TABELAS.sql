-- ============================================
-- CRIAR TABELAS PARA RPG CHARACTER SHEET
-- ============================================

-- 1. CRIAR TABELA INVENTARIO
CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personagem_id UUID NOT NULL REFERENCES personagens(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    descricao TEXT,
    peso DECIMAL(10, 2) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CRIAR TABELA ANOTACOES
CREATE TABLE IF NOT EXISTS anotacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personagem_id UUID NOT NULL REFERENCES personagens(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADICIONAR CAMPO NIVEL NAS TABELAS EXISTENTES
ALTER TABLE magias ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;
ALTER TABLE habilidades ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;
ALTER TABLE conhecimentos ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;

-- 4. REMOVER CAMPO NIVEL_REQUERIDO (SE EXISTIR)
ALTER TABLE magias DROP COLUMN IF EXISTS nivel_requerido;
ALTER TABLE habilidades DROP COLUMN IF EXISTS nivel_requerido;
ALTER TABLE conhecimentos DROP COLUMN IF EXISTS nivel_requerido;

-- 5. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_inventario_personagem ON inventario(personagem_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_personagem ON anotacoes(personagem_id);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS) - OPCIONAL MAS RECOMENDADO
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS (OPCIONAL)
-- Permitir que usuários vejam apenas seus próprios itens
CREATE POLICY "Usuários podem ver seus próprios itens" 
    ON inventario FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem inserir itens" 
    ON inventario FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar seus itens" 
    ON inventario FOR UPDATE 
    USING (true);

CREATE POLICY "Usuários podem deletar seus itens" 
    ON inventario FOR DELETE 
    USING (true);

CREATE POLICY "Usuários podem ver suas anotações" 
    ON anotacoes FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem inserir anotações" 
    ON anotacoes FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas anotações" 
    ON anotacoes FOR UPDATE 
    USING (true);

CREATE POLICY "Usuários podem deletar suas anotações" 
    ON anotacoes FOR DELETE 
    USING (true);
