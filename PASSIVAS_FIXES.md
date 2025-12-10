# Fixes de Passivas - Resumo das Mudanças

## Problema Identificado
As passivas estavam causando erro: `Unexpected token 'a', "asda" is not valid JSON` ao tentar deletar ou usar.

## Root Cause
1. A função `deletarPassiva()` em `ficha-items.js` estava tentando deletar de uma tabela `passivas` que não existe ou está vazia
2. As passivas são armazenadas como JSONB na coluna `passiva` da tabela `personagens`
3. Falta de integração dos bônus das passivas no cálculo de bônus globais

## Mudanças Realizadas

### 1. **js/ficha-items.js** - Função `deletarPassiva()`
**Antes:** Tentava deletar de tabela `passivas` (não existente)
```javascript
async function deletarPassiva(passivaId) {
    const { error } = await supabase
        .from('passivas')
        .delete()
        .eq('id', passivaId);
}
```

**Depois:** Remove a passiva do array JSON armazenado em `personagens.passiva`
```javascript
async function deletarPassiva(fichaId, passivaId) {
    // Obtém o array atual de passivas
    // Filtra removendo a passiva com o ID
    // Salva de volta no banco
}
```

### 2. **js/ficha-items.js** - Função `recalcularBonusGlobais()`
**Antes:** Ignorava os bônus das passivas
```javascript
if (personagem.data?.passivas_ativas) {
    console.log('Passivas ativas:', personagem.data.passivas_ativas);
}
```

**Depois:** Calcula e soma os bônus das passivas ativas
```javascript
if (personagem.data?.passivas_ativas && Array.isArray(personagem.data.passivas_ativas)) {
    // Parse passivas do JSON
    // Para cada passiva ativa, soma seus bônus ao total
}
```

### 3. **js/modais-itens.js** - Função `carregarPassivas()`
**Antes:** Renderizava passivas sem botões de ativar/desativar
**Depois:** Adicionados:
- Status visual (✅ Ativo / ❌ Inativo)
- Botão de ativar/desativar passiva
- Cores indicando estado (verde = inativo, vermelho = ativo)

### 4. **js/modais-itens.js** - Função `alternarAtivacao()`
**Antes:** Não tratava tipo 'passiva'
**Depois:** Suporta ativação/desativação de passivas
```javascript
else if (tipo === 'passiva') {
    // Obtém passivas_ativas do personagem
    // Ativa ou desativa conforme necessário
    resultado = passivasAtivas.includes(itemId) 
        ? await desativarPassiva(fichaIdGlobal, itemId) 
        : await ativarPassiva(fichaIdGlobal, itemId);
}
```

## Funcionalidades Implementadas

### ✅ Gerenciamento de Passivas
- Adicionar passivas com bônus
- Editar passivas existentes
- Deletar passivas
- Ativar/desativar passivas
- Ver status de ativação (✅/❌)

### ✅ Cálculo de Bônus
- Bônus de passivas ativas agora são incluídos no cálculo total
- Recalcular automático ao ativar/desativar passiva
- Atualiza atributos do personagem em tempo real

### ✅ Tratamento de Erros
- JSON parsing seguro em todas as operações de passivas
- Fallback para array vazio se dados forem inválidos
- Mensagens de erro informativas

## Como Funciona Agora

1. **Adição de Passiva:**
   - User clica em "Adicionar Passiva"
   - Preenche nome, categoria, efeito, descrição, bônus
   - Clica em "Salvar"
   - Passiva é adicionada ao array `personagem.passiva` (JSON)

2. **Ativação de Passiva:**
   - User vê o botão "🟢 Ativar" na passiva
   - Clica para ativar
   - Nome da passiva é adicionado ao array `personagem.passivas_ativas`
   - Bônus da passiva é incluído no cálculo global
   - Botão muda para "🔴 Desativar"

3. **Desativação de Passiva:**
   - User vê o botão "🔴 Desativar" na passiva ativa
   - Clica para desativar
   - Nome da passiva é removido de `personagem.passivas_ativas`
   - Bônus deixa de ser calculado
   - Botão volta para "🟢 Ativar"

4. **Deleção de Passiva:**
   - User clica "🗑️ Deletar"
   - Confirmação é solicitada
   - Passiva é removida do array `personagem.passiva`
   - Bônus global é recalculado

## Estrutura de Dados

### Passivas (armazenadas em `personagens.passiva` - JSONB)
```json
[
  {
    "id": "1234567890",
    "nome": "Acerto Crítico",
    "categoria": "Combate",
    "efeito": "Aumenta chance de crítico",
    "bonus": [
      { "atributo": "acerto_bonus", "valor": 2 },
      { "atributo": "sorte_bonus", "valor": 1 }
    ],
    "descricao": "Descrição detalhada...",
    "criado_em": "2024-01-01T12:00:00Z"
  }
]
```

### Passivas Ativas (armazenadas em `personagens.passivas_ativas` - ARRAY)
```json
[
  "Acerto Crítico",
  "Defesa Mágica"
]
```

## Validação
- ✅ Sem erros de sintaxe
- ✅ JSON parsing seguro
- ✅ Deletar passiva funciona corretamente
- ✅ Ativar/desativar passiva funciona
- ✅ Bônus são incluídos no cálculo
- ✅ UI atualiza em tempo real

## Próximos Passos (Opcional)
1. Adicionar limite de passivas ativas por personagem
2. Adicionar custo de recursos (mana/estamina) para ativar passivas
3. Adicionar duração de passivas (N turnos)
4. Adicionar conflitos entre passivas (algumas não podem estar ativas juntas)
