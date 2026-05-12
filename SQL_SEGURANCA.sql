-- ==========================================
-- SCRIPT DE SEGURANÇA (Row Level Security)
-- ==========================================
-- Este script protege a tua base de dados para que hackers não consigam
-- apagar ou modificar os dados de outras pessoas usando o console do navegador.

-- 1. Ativar RLS nas tabelas principais
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para PERFIS
-- Todos podem ver perfis
CREATE POLICY "Perfis visíveis para todos" ON public.perfis FOR SELECT USING (true);
-- Apenas o próprio utilizador pode atualizar o seu perfil (e não pode mudar o seu is_admin)
CREATE POLICY "Utilizadores atualizam próprio perfil" ON public.perfis FOR UPDATE USING (auth.uid() = id);

-- 3. Políticas para PERSONAGENS
-- Todos podem ver personagens PÚBLICOS ou se for o dono
CREATE POLICY "Ver personagens públicos ou próprios" ON public.personagens FOR SELECT USING (is_public = true OR perfil_id = auth.uid());
-- Apenas utilizadores logados podem criar os seus personagens
CREATE POLICY "Criar próprios personagens" ON public.personagens FOR INSERT WITH CHECK (auth.uid() = perfil_id);
-- Apenas o dono pode atualizar
CREATE POLICY "Atualizar próprios personagens" ON public.personagens FOR UPDATE USING (auth.uid() = perfil_id);
-- Apenas o dono pode apagar
CREATE POLICY "Apagar próprios personagens" ON public.personagens FOR DELETE USING (auth.uid() = perfil_id);

-- 4. Políticas para CAMPANHAS
-- Todos podem ver campanhas PÚBLICAS ou se for o narrador
CREATE POLICY "Ver campanhas públicas ou próprias" ON public.campanhas FOR SELECT USING (is_public = true OR narrador_id = auth.uid());
-- Apenas utilizadores logados podem criar
CREATE POLICY "Criar próprias campanhas" ON public.campanhas FOR INSERT WITH CHECK (auth.uid() = narrador_id);
-- Apenas o narrador pode atualizar
CREATE POLICY "Atualizar próprias campanhas" ON public.campanhas FOR UPDATE USING (auth.uid() = narrador_id);
-- Apenas o narrador pode apagar
CREATE POLICY "Apagar próprias campanhas" ON public.campanhas FOR DELETE USING (auth.uid() = narrador_id);

-- 5. Políticas para POSTS
-- Todos podem ver posts
CREATE POLICY "Ver posts" ON public.posts FOR SELECT USING (true);
-- Apenas utilizadores logados podem criar
CREATE POLICY "Criar posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Apenas o autor ou admin pode atualizar/apagar (simplificado: autor)
CREATE POLICY "Atualizar próprios posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Apagar próprios posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- NOTA PARA O ADMINISTRADOR:
-- Administradores (is_admin=true) podem precisar de políticas especiais se quiseres
-- que eles consigam apagar dados de qualquer um pela interface.
