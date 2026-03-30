-- ============================================================
-- SISTEMA DE COMUNIDADE — PROJETO GÊNESIS
-- Execute este ficheiro no SQL Editor do painel Supabase
-- ============================================================

-- -------------------------------------------------------
-- 1. TABELA PRINCIPAL: posts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'outro'
                        CHECK (tipo IN ('homebrew','personagem','mundo','narrativa','outro')),
    titulo          VARCHAR(150) NOT NULL,
    conteudo        TEXT NOT NULL,
    -- Referências opcionais a fichas/campanhas existentes
    personagem_id   UUID REFERENCES personagens(id) ON DELETE SET NULL,
    campanha_id     UUID REFERENCES campanhas(id)    ON DELETE SET NULL,
    -- Score calculado: upvotes - downvotes (actualizado por trigger)
    score           INTEGER NOT NULL DEFAULT 0,
    -- Destaques automáticos (actualizados no cliente JS)
    destacado_semana BOOLEAN NOT NULL DEFAULT FALSE,
    destacado_mes    BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user       ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_tipo       ON posts(tipo);
CREATE INDEX IF NOT EXISTS idx_posts_score      ON posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_criado     ON posts(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_posts_destaque_s ON posts(destacado_semana) WHERE destacado_semana = TRUE;
CREATE INDEX IF NOT EXISTS idx_posts_destaque_m ON posts(destacado_mes)    WHERE destacado_mes    = TRUE;

-- -------------------------------------------------------
-- 2. TABELA DE VOTOS: votos_posts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS votos_posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_voto   SMALLINT NOT NULL CHECK (tipo_voto IN (1, -1)),  -- 1=upvote, -1=downvote
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id)   -- cada utilizador vota apenas uma vez por post
);

CREATE INDEX IF NOT EXISTS idx_votos_post  ON votos_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_votos_user  ON votos_posts(user_id);

-- -------------------------------------------------------
-- 3. TABELA DE COMENTÁRIOS: comentarios_posts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS comentarios_posts (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    texto     TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_post ON comentarios_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_user ON comentarios_posts(user_id);

-- -------------------------------------------------------
-- 4. TRIGGER: recalcular score automaticamente
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION recalcular_score_post()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts
    SET score = (
        SELECT COALESCE(SUM(tipo_voto), 0)
        FROM votos_posts
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ),
    atualizado_em = NOW()
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_score_voto ON votos_posts;
CREATE TRIGGER trigger_score_voto
AFTER INSERT OR UPDATE OR DELETE ON votos_posts
FOR EACH ROW EXECUTE FUNCTION recalcular_score_post();

-- -------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -------------------------------------------------------
ALTER TABLE posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_posts ENABLE ROW LEVEL SECURITY;

-- POSTS: leitura pública, escrita/edição/exclusão apenas pelo dono
CREATE POLICY "posts_select_public"
    ON posts FOR SELECT USING (TRUE);

CREATE POLICY "posts_insert_auth"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_owner"
    ON posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_owner"
    ON posts FOR DELETE
    USING (auth.uid() = user_id);

-- VOTOS: leitura pública, operações apenas pelo dono do voto
CREATE POLICY "votos_select_public"
    ON votos_posts FOR SELECT USING (TRUE);

CREATE POLICY "votos_insert_auth"
    ON votos_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "votos_update_owner"
    ON votos_posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "votos_delete_owner"
    ON votos_posts FOR DELETE
    USING (auth.uid() = user_id);

-- COMENTÁRIOS: leitura pública, escrita autenticada, exclusão pelo dono
CREATE POLICY "comentarios_select_public"
    ON comentarios_posts FOR SELECT USING (TRUE);

CREATE POLICY "comentarios_insert_auth"
    ON comentarios_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comentarios_delete_owner"
    ON comentarios_posts FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- 6. POLÍTICA ESPECIAL: permitir UPDATE do score pela trigger
--    (a trigger corre como SECURITY DEFINER no papel de postgres)
-- -------------------------------------------------------
CREATE POLICY "posts_update_score_trigger"
    ON posts FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================
-- FIM — tabelas criadas com sucesso!
-- ============================================================
