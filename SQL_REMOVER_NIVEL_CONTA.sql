-- Script para remover o nível da conta da tabela de perfis
ALTER TABLE public.perfis DROP COLUMN IF EXISTS nivel_conta;
