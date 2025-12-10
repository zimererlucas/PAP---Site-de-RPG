#!/usr/bin/env powershell

# Script para executar a migração do banco de dados
# Adiciona o sistema de dados (dice rolls) às tabelas

# Executar SQL_ADICIONAR_DADOS.sql no Supabase

Write-Host "=== Sistema de Dados (Dice Rolls) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ativar o sistema de dados, execute o arquivo SQL_ADICIONAR_DADOS.sql no Supabase:"
Write-Host ""
Write-Host "1. Abra o Supabase Dashboard"
Write-Host "2. Vá para SQL Editor"
Write-Host "3. Cole o conteúdo de SQL_ADICIONAR_DADOS.sql"
Write-Host "4. Execute a query"
Write-Host ""
Write-Host "Isso irá adicionar as colunas 'dados' JSONB às tabelas:"
Write-Host "  - magias"
Write-Host "  - habilidades"
Write-Host "  - conhecimentos"
Write-Host "  - inventario"
Write-Host ""
Write-Host "Pronto! O sistema de dados está ativado." -ForegroundColor Green
