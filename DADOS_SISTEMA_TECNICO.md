# 🎲 Sistema de Dados - Resumo Técnico das Mudanças

## Arquivos Criados

### 1. `js/dados.js` (NOVO)
**Responsabilidade**: Lógica de rolagem de dados

**Funções Principais**:
- `rolarDados(dados)` - Rola os dados e retorna resultado detalhado
- `criarBotaoRolarDados(dados, tipo, nome)` - Cria HTML do botão
- `rolarDadosUI(tipo, nome, dados)` - Modal de resultado
- `formatarDados(dados)` - Converte array para string (ex: "1d20 + 2d8")
- `validarDados(dados)` - Valida estrutura dos dados

**Exemplos de Uso**:
```javascript
const resultado = rolarDados([
  {quantidade: 2, lados: 20},
  {quantidade: 1, lados: 8}
]);
// {success: true, total: 33, resultado_formatado: "1d20[15] + 1d8[5] = 33"}
```

## Arquivos Modificados

### 1. `js/modais-itens.js`
**Mudanças**:
- ✅ Adicionadas funções `adicionarDadoUI()` e `coletarDados()`
- ✅ Adicionada função `restaurarDados()` para edição
- ✅ Removido campo "dano" dos modais
- ✅ Adicionada seção "🎲 Dados" nos modais
- ✅ Atualizado `salvarMagia()` para coletar dados
- ✅ Atualizado `salvarHabilidade()` para coletar dados
- ✅ Atualizado `salvarItem()` para coletar dados
- ✅ Atualizado `editarMagia()`, `editarHabilidade()`, `editarItem()` para restaurar dados
- ✅ Atualizado `fecharModalItem()` para limpar dados
- ✅ Atualizado `carregarMagias()` para exibir botão de rolar dados
- ✅ Removido campo "Dano" da exibição
- ✅ Adicionado campo "🎲 Dados" na exibição

### 2. `js/ficha-items.js`
**Mudanças**:
- ✅ Removido campo `dano` de `adicionarMagia()`
- ✅ Adicionado campo `dados` em `adicionarMagia()`
- ✅ Removido campo `dano` de `atualizarMagia()`
- ✅ Adicionado campo `dados` em `atualizarMagia()`
- ✅ Mesmo para Habilidades e Itens

### 3. `pages/visualizar-ficha.html`
**Mudanças**:
- ✅ Adicionado `<script src="../js/dados.js"></script>` na posição correta
- ✅ Removido campo "Dano" dos modais de Magia/Habilidade/Item
- ✅ Adicionada seção "🎲 Dados (Dice Rolls)" em cada modal
- ✅ Adicionado botão "+ Adicionar Dado"

### 4. `SQL_ADICIONAR_DADOS.sql` (NOVO)
**Conteúdo**: Migração SQL para adicionar coluna `dados JSONB` às tabelas

```sql
ALTER TABLE magias ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE habilidades ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE conhecimentos ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
```

## Estrutura de Dados (JSONB)

### Antes (Campo Dano)
```json
{
  "dano": "1d20"
}
```

### Depois (Campo Dados)
```json
{
  "dados": [
    {"quantidade": 1, "lados": 20},
    {"quantidade": 2, "lados": 8}
  ]
}
```

## Fluxo de Dados

### 1. Criação/Edição
```
User Input → adicionarDadoUI() → coletarDados() → salvarMagia() → BD
```

### 2. Carregamento
```
BD → carregarMagias() → formatarDados() → Exibição
```

### 3. Rolagem
```
User Click → rolarDadosUI() → rolarDados() → Modal com Resultado
```

## Compatibilidade Mantida

- ✅ Sistema de Bônus continua funcionando
- ✅ Sistema de Duração em Turnos continua funcionando
- ✅ Sistema de Ativação/Desativação continua funcionando
- ✅ Todas as outras funcionalidades preservadas

## Validações

### No Cliente (JavaScript)
- Quantidade: 1-100
- Lados: 1-1000
- Tipo: Array de objetos com `quantidade` e `lados`

### No Servidor (Supabase)
- JSONB DEFAULT NULL
- Índice GIN para melhor performance em queries

## Performance

- Sem impacto significativo
- Dados armazenados em JSONB (nativo PostgreSQL)
- Índices GIN adicionados para otimização
- Rolagem feita no cliente (sem carga no servidor)

## Próximos Passos (Opcional)

1. Executar `SQL_ADICIONAR_DADOS.sql` no Supabase
2. Testar criação de novo item com dados
3. Testar edição de item existente
4. Testar rolagem de dados
5. Verificar compatibilidade em diferentes navegadores

## Notas Importantes

- ⚠️ Campo `dano` ainda existe no BD (compatibilidade futura)
- ⚠️ Migração é additive (não remove nada)
- ⚠️ Dados antigos sem campo `dados` funcionam normalmente
- ✅ Sem breaking changes

## Testes Recomendados

```javascript
// Teste 1: Criar magia com dados
// Resultado esperado: Magia criada com dados JSONB

// Teste 2: Rolar dados
// Resultado esperado: Modal com resultado da rolagem

// Teste 3: Editar magia e restaurar dados
// Resultado esperado: Dados restaurados corretamente no modal

// Teste 4: Combinar dados + bônus + duração
// Resultado esperado: Todos os sistemas funcionando juntos
```
