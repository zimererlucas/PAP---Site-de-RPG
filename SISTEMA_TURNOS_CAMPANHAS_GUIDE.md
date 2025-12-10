# Sistema de Turnos em Campanhas

## 📋 Visão Geral

O novo sistema permite que:
- **Mestre (dono da campanha)** passa um turno para **TODA a campanha**
- Todos os **personagens sincronizam** o mesmo turno
- **Habilidades, magias, itens e passivas** com duração são **automaticamente decrementadas**
- Ao atingir **0 turnos, o item é automaticamente desativado**
- **Bônus são recalculados** para todos os personagens

## 🎮 Como Funciona

### Estrutura de Turnos

```
Turno 0 (Início)
├─ Jogador 1: Ativa "Escudo Mágico" por 3 turnos
├─ Jogador 2: Ativa "Buff de Força" por 2 turnos
└─ Jogador 3: Ativa "Invisibilidade" por 1 turno

Turno 1 (Mestre clica "Passar Turno")
├─ Jogador 1: "Escudo Mágico" agora 2 turnos restantes
├─ Jogador 2: "Buff de Força" agora 1 turno restante
└─ Jogador 3: "Invisibilidade" EXPIROU (0 turnos)

Turno 2 (Mestre clica "Passar Turno" novamente)
├─ Jogador 1: "Escudo Mágico" agora 1 turno restante
└─ Jogador 2: "Buff de Força" EXPIROU (0 turnos)
```

## 🔧 Funções Principais

### 1. **Passar Turno para Campanha**
```javascript
await passarTurnoCampanha(campanhaId)
```
- Só funciona se você for o **dono da campanha**
- Incrementa `turno_atual` em 1
- Processa **todos os personagens** simultaneamente
- Registra no log quem passou o turno

**Resposta:**
```json
{
  "success": true,
  "mensagem": "✅ Turno 5 iniciado! Todos os personagens processados.",
  "turno_novo": 5,
  "personagens_processados": 3
}
```

### 2. **Ativar Item com Duração**
```javascript
await ativarItemComDuracao(
    personagemId,
    itemId,
    tabela,          // 'habilidades', 'magias', 'inventario'
    duracaoTurnos,   // Quantos turnos durará
    campanhaId
)
```

**Exemplo:**
```javascript
const resultado = await ativarItemComDuracao(
    'player-123',
    'escudo-magico-id',
    'habilidades',
    3,                  // 3 turnos de duração
    'campanha-456'
);

if (resultado.success) {
    console.log('✅ Escudo Mágico ativado por 3 turnos!');
    console.log(`Turno de ativação: ${resultado.turno_ativacao}`);
}
```

### 3. **Obter Turno Atual**
```javascript
const { turno } = await obterTurnoAtual(campanhaId);
console.log(`Turno atual: ${turno}`);
```

### 4. **Obter Histórico de Turnos**
```javascript
const { data: turnos } = await obterHistoricoTurnos(campanhaId);
turnos.forEach(turno => {
    console.log(`Turno ${turno.numero_turno} - ${turno.criado_em}`);
});
```

## 🎨 UI - Botão Passar Turno

Para adicionar o botão na página do mestre:

```html
<!-- Na página visualizar-campanha.html -->
<div id="master-controls">
    ${renderizarBotaoPassarTurno(campanhaId)}
</div>
```

Ou em JavaScript:
```javascript
const container = document.getElementById('controls');
container.innerHTML = renderizarBotaoPassarTurno(campanhaId);
```

O botão está estilizado com:
- ⏭️ Ícone visual
- Gradiente roxo/azul
- Shadow ao hover
- Clique executa `executarPassarTurnoCampanha(campanhaId)`

## 📊 Visualizar Duração

Renderizar a barra de duração de um item:

```javascript
// Em uma habilidade/magia/item
const html = renderizarInfoDuracao(item);

// Resultado:
// ┌─────────────────────────┐
// │ Duração: 2/3 turnos    │
// │ ████████░░░░░░░░░░░░░░░│
// └─────────────────────────┘
```

Cores dinâmicas:
- **🟢 Verde**: > 50% de duração restante
- **🟡 Amarelo**: 25-50% de duração restante
- **🔴 Vermelho**: ≤ 25% de duração restante

## 💾 Banco de Dados

### Novas Tabelas/Colunas

**Tabela `campanha_turnos`:**
```sql
id                UUID PRIMARY KEY
campanha_id       UUID (referência campanhas)
numero_turno      INTEGER
criado_em         TIMESTAMP
passado_por       UUID (referência auth.users)
```

**Colunas adicionadas em `campanhas`:**
```sql
turno_atual INTEGER DEFAULT 0
```

**Colunas adicionadas em `habilidades`, `magias`, `inventario`:**
```sql
turno_ativacao INTEGER          -- Turno em que foi ativado
duracao_turnos INTEGER          -- Quantos turnos durará
turnos_restantes INTEGER        -- Turnos ainda restantes
```

**Coluna adicionada em `personagens`:**
```sql
ultimo_turno_processado INTEGER DEFAULT 0
```

## 🔄 Fluxo de Passagem de Turno

1. **Mestre clica "Passar Turno"**
   ```
   executarPassarTurnoCampanha(campanhaId)
   ```

2. **Sistema faz:**
   - Incrementa `campanhas.turno_atual`
   - Registra no log (`campanha_turnos`)
   - Para cada personagem:
     - Obtém `ultimo_turno_processado`
     - Se < turno_atual, processa:
       - Decrementa todas as habilidades ativas
       - Decrementa todas as magias ativas
       - Decrementa todos os itens ativos
       - Desativa os que chegaram a 0
       - Recalcula bônus
       - Atualiza `ultimo_turno_processado`

3. **UI atualiza:**
   - Recarrega personagens
   - Exibe nova duração
   - Mostra items que expiraram

## 📍 Integração Prática

### Na página do Mestre (`visualizar-campanha.html`):

```html
<div class="master-panel">
    <h2>⏱️ Controle de Turnos</h2>
    <p>Turno Atual: <strong id="turno-atual">0</strong></p>
    <div id="botao-passar-turno"></div>
</div>
```

```javascript
// No js/visualizar-campanha.js
async function inicializarTurnos() {
    const campanhaId = obterCampanhaId();
    const { turno } = await obterTurnoAtual(campanhaId);
    
    document.getElementById('turno-atual').textContent = turno;
    document.getElementById('botao-passar-turno').innerHTML = 
        renderizarBotaoPassarTurno(campanhaId);
}
```

### Na página do Jogador (`visualizar-campanha-jogador.html`):

As durações aparecem automaticamente quando carregar os personagens:

```javascript
// Habilidade com duração exibida assim:
// ┌─────────────────────────────────┐
// │ Escudo Mágico            [Ativo] │
// │ Duração: 2/3 turnos            │
// │ ████████░░░░░░░░░░░░░░░░░░░░░│
// └─────────────────────────────────┘
```

## ✨ Exemplos Completos

### Cenário 1: Mestre passando turno

```javascript
// Mestre clica no botão
const resultado = await passarTurnoCampanha('campanha-123');

if (resultado.success) {
    console.log(`✅ Turno ${resultado.turno_novo} iniciado!`);
    console.log(`${resultado.personagens_processados} personagens processados`);
    
    // UI atualiza automaticamente via executarPassarTurnoCampanha
}
```

### Cenário 2: Jogador ativando habilidade com duração

```javascript
// Jogador clica em "Ativar" uma habilidade
const resultado = await ativarItemComDuracao(
    'player-1',
    'lightning-bolt',
    'habilidades',
    2,                  // 2 turnos
    'campanha-123'
);

if (resultado.success) {
    console.log('✅ Lightning Bolt ativado por 2 turnos!');
    console.log(`Ativado no turno: ${resultado.turno_ativacao}`);
}
```

### Cenário 3: Acompanhando durações

```javascript
// Periodicamente, mostrar quais items expiram quando
const { data: turnos } = await obterHistoricoTurnos('campanha-123');

console.log(`Última ação: Turno ${turnos[0].numero_turno}`);
console.log(`Passado por: ${turnos[0].passado_por}`);
```

## 🐛 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|--------|
| Botão "Passar Turno" não aparece | `campanhaId` não definido | Verificar `obterCampanhaId()` |
| Items não desativam | `turnos_restantes` NULL | Verificar coluna no BD |
| Bônus não atualizam | `recalcularBonusGlobais` não chamado | Já está automático em `processarDuracaoPersonagem` |
| Erro "não é dono" | Usuário não é dono da campanha | Apenas mestre pode passar turno |

## 🚀 Próximas Melhorias

- [ ] Animações ao passar turno
- [ ] Notificações em tempo real para jogadores
- [ ] Efeitos visuais de expiração
- [ ] Sistema de round (rodadas) em combate
- [ ] Modificadores de duração por itens mágicos
