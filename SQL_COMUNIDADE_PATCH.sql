-- ============================================================
-- PATCH SQL_COMUNIDADE — Corrigir Foreign Keys para perfis
-- Execute este ficheiro no SQL Editor do Supabase
-- APÓS ter executado o SQL_COMUNIDADE.sql
-- ============================================================

-- O PostgREST só consegue resolver relações que apontam para
-- tabelas no schema 'public'. Como 'auth.users' está noutro
-- schema, temos de referenciar 'perfis' diretamente.

-- -------------------------------------------------------
-- POSTS: mudar user_id → perfis(id)
-- -------------------------------------------------------
ALTER TABLE posts
    DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE posts
    ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES perfis(id)
    ON DELETE CASCADE;

-- -------------------------------------------------------
-- VOTOS_POSTS: mudar user_id → perfis(id)
-- -------------------------------------------------------
ALTER TABLE votos_posts
    DROP CONSTRAINT IF EXISTS votos_posts_user_id_fkey;

ALTER TABLE votos_posts
    ADD CONSTRAINT votos_posts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES perfis(id)
    ON DELETE CASCADE;

-- -------------------------------------------------------
-- COMENTARIOS_POSTS: mudar user_id → perfis(id)
-- -------------------------------------------------------
ALTER TABLE comentarios_posts
    DROP CONSTRAINT IF EXISTS comentarios_posts_user_id_fkey;

ALTER TABLE comentarios_posts
    ADD CONSTRAINT comentarios_posts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES perfis(id)
    ON DELETE CASCADE;

-- -------------------------------------------------------
-- Actualizar a política RLS que usava auth.uid()
-- (auth.uid() continua a funcionar porque perfis.id = auth.uid())
-- -------------------------------------------------------
-- Já estão correctas — auth.uid() retorna o mesmo id que perfis.id

-- ============================================================
-- FIM — relações corrigidas!
-- ============================================================
