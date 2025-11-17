-- ============================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================

-- 1. HABILITAR RLS NAS TABELAS
ALTER TABLE magias ENABLE ROW LEVEL SECURITY;
ALTER TABLE habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE conhecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA MAGIAS
-- ============================================

-- Permitir SELECT (ler)
CREATE POLICY "Usuários podem ler magias" 
    ON magias FOR SELECT 
    USING (true);

-- Permitir INSERT (criar)
CREATE POLICY "Usuários podem criar magias" 
    ON magias FOR INSERT 
    WITH CHECK (true);

-- Permitir UPDATE (atualizar)
CREATE POLICY "Usuários podem atualizar magias" 
    ON magias FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Permitir DELETE (deletar)
CREATE POLICY "Usuários podem deletar magias" 
    ON magias FOR DELETE 
    USING (true);

-- ============================================
-- POLÍTICAS PARA HABILIDADES
-- ============================================

CREATE POLICY "Usuários podem ler habilidades" 
    ON habilidades FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem criar habilidades" 
    ON habilidades FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar habilidades" 
    ON habilidades FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários podem deletar habilidades" 
    ON habilidades FOR DELETE 
    USING (true);

-- ============================================
-- POLÍTICAS PARA CONHECIMENTOS
-- ============================================

CREATE POLICY "Usuários podem ler conhecimentos" 
    ON conhecimentos FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem criar conhecimentos" 
    ON conhecimentos FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar conhecimentos" 
    ON conhecimentos FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários podem deletar conhecimentos" 
    ON conhecimentos FOR DELETE 
    USING (true);

-- ============================================
-- POLÍTICAS PARA INVENTARIO
-- ============================================

CREATE POLICY "Usuários podem ler inventário" 
    ON inventario FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem criar itens" 
    ON inventario FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar itens" 
    ON inventario FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários podem deletar itens" 
    ON inventario FOR DELETE 
    USING (true);

-- ============================================
-- POLÍTICAS PARA ANOTACOES
-- ============================================

CREATE POLICY "Usuários podem ler anotações" 
    ON anotacoes FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem criar anotações" 
    ON anotacoes FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar anotações" 
    ON anotacoes FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários podem deletar anotações" 
    ON anotacoes FOR DELETE 
    USING (true);
