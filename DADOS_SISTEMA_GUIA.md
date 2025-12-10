# 🎲 Sistema de Dados (Dice Rolls) - Guia Completo

## Resumo das Mudanças

O sistema de dados substitui o campo "Dano" por um sistema profissional de rolagem de dados, permitindo criar dados customizados como 1d20, 2d8, 3d50, etc.

## 🔧 Instalação

### 1. Executar Migração do Banco de Dados

Execute o arquivo `SQL_ADICIONAR_DADOS.sql` no Supabase:

```sql
ALTER TABLE magias ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE habilidades ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
ALTER TABLE conhecimentos ADD COLUMN IF NOT EXISTS conhecimentos JSONB DEFAULT NULL;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS dados JSONB DEFAULT NULL;
```

## 📝 Como Usar

### Adicionar/Editar Dados em Magias

1. Clique em "+ Adicionar Magia" ou "✏️ Editar" em uma magia existente
2. Na seção **🎲 Dados (Dice Rolls)**, clique em "+ Adicionar Dado"
3. Configure:
   - **Quantidade**: Quantos dados (1-100)
   - **Lados**: Tipo de dado (d4, d6, d8, d10, d12, d20, d50, d100, etc)
4. Adicione mais dados se precisar (exemplo: 2d20 + 1d8)
5. Clique em "Salvar"

### Rolar Dados

Quando uma magia/habilidade/item tem dados configurados:

1. Abra a lista de magias/habilidades/itens
2. Clique no item para ver os detalhes
3. Clique no botão **🎲 Rolar Dados (XdY)** 
4. Um modal mostrará:
   - O resultado total
   - Detalhamento de cada dado rolado
   - Botão para rolar novamente

### Exemplos de Dados

| Descrição | Configuração |
|-----------|-------------|
| Um d20 | 1 dado, 20 lados |
| Dois d8 | 2 dados, 8 lados |
| 1d20 + 1d10 | 2 seções: (1, 20) + (1, 10) |
| Crítico 3d20 | 3 dados, 20 lados |
| Dano variado | 2 dados, 50 lados (2d50) |

## 📊 Estrutura de Dados

Os dados são armazenados como JSONB no banco:

```json
{
  "dados": [
    { "quantidade": 2, "lados": 20 },
    { "quantidade": 1, "lados": 8 }
  ]
}
```

## 🎯 Formato de Exibição

- No modal: "🎲 Dados"
- Na lista: "1d20 + 2d8" (formato formatado)
- Resultado: "1d20[15] + 2d8[5, 3] = 23"

## 🔄 Compatibilidade

- ✅ Funciona com Magias
- ✅ Funciona com Habilidades  
- ✅ Funciona com Itens (Inventário)
- ✅ Mantém compatibilidade com Bônus
- ✅ Mantém compatibilidade com Duração em Turnos

## ⚙️ Configurações de Dados Válidas

- **Quantidade**: 1-100
- **Lados**: 1-1000 (comum: 4, 6, 8, 10, 12, 20, 50, 100, 1000)

## 📱 Interface

### Modal de Magia/Habilidade/Item

```
┌─────────────────────────────┐
│ 🎲 Dados (Dice Rolls)       │
├─────────────────────────────┤
│ [1] d [20] [🗑️]             │
│ [2] d [8]  [🗑️]             │
├─────────────────────────────┤
│ + Adicionar Dado            │
└─────────────────────────────┘
```

### Modal de Resultado

```
┌─────────────────────────────┐
│ 🎲 Nome da Magia            │
├─────────────────────────────┤
│        23                   │
│ 1d20[15] + 2d8[5, 3] = 23  │
├─────────────────────────────┤
│ [🔄 Rolar Novamente] [Fechar]│
└─────────────────────────────┘
```

## 🛠️ Troubleshooting

### Dados não aparecem ao editar

1. Verifique se a migração SQL foi executada
2. Recarregue a página (F5)
3. Verifique o console (F12) para erros

### Botão de rolar não funciona

1. Certifique-se de que há dados configurados
2. Verifique se a quantidade e lados estão com valores válidos
3. Verifique se o arquivo `js/dados.js` foi carregado

## 📚 Arquivos Modificados

- `js/dados.js` - Sistema de rolagem de dados (NOVO)
- `js/modais-itens.js` - Interface de adicionar dados
- `js/ficha-items.js` - Persistência no banco
- `pages/visualizar-ficha.html` - UI dos modais

## 🔐 Notas de Segurança

- Os dados são armazenados em JSONB no servidor
- A rolagem é feita no cliente (JavaScript)
- Nenhum servidor-side validation é necessário
- Todos os atributos são validados antes de salvar

## 🚀 Próximas Melhorias Possíveis

- [ ] Histórico de rolagens
- [ ] Modificadores permanentes aos dados
- [ ] Templates de dados comuns
- [ ] Integração com sistema de combate
- [ ] Rolagens críticas automáticas
- [ ] Suporte a dados percentuais (d100)
