# Sistema Automático de Duração em Turnos

## 📋 Visão Geral

Este sistema gerencia automaticamente a duração de habilidades em turnos de combate, permitindo que:
- Habilidades sejam ativadas por um número específico de turnos
- Durações sejam decrementadas automaticamente
- Habilidades sejam desativadas automaticamente ao expirar
- Bônus sejam recalculados após cada turno

## 🎯 Funcionalidades Principais

### 1. **Ativar Habilidade com Duração**
```javascript
await ativarHabilidadeComDuracao(fichaId, habilidadeId, duracaoTurnos)
```
- Ativa uma habilidade por `N` turnos
- Desconta recursos (mana/estamina)
- Define `turnos_restantes = duracaoTurnos`
- Retorna sucesso ou erro

**Exemplo:**
```javascript
const resultado = await ativarHabilidadeComDuracao('ficha-123', 'hab-456', 3);
// Ativa a habilidade por 3 turnos
if (resultado.success) {
    console.log('✅ Habilidade ativada por 3 turnos!');
}
```

### 2. **Avançar Turno**
```javascript
await avancarTurno(fichaId)
```
- Decrementa 1 turno de todas as habilidades ativas
- Desativa habilidades quando `turnos_restantes === 0`
- Recalcula bônus globais automaticamente
- Retorna número de habilidades desativadas

**Exemplo:**
```javascript
const resultado = await avancarTurno('ficha-123');
console.log(`✅ ${resultado.habilidadesDesativadas} habilidades expiraram`);
```

### 3. **Obter Status de Durações**
```javascript
await obterStatusDuracoes(fichaId)
```
- Retorna lista de habilidades ativas com suas durações
- Calcula percentual restante
- Útil para exibir barra de progresso

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "hab-456",
      "nome": "Escudo Mágico",
      "turnos_restantes": 2,
      "duracao_total": 3,
      "percentual": 66.67
    }
  ]
}
```

### 4. **Renderizar Barra de Duração**
```javascript
renderizarBarraDuracao(habilidade)
```
- Cria uma barra visual de progresso
- Cores dinâmicas (verde > 50%, amarelo > 25%, vermelho ≤ 25%)
- Mostra "X/Y turnos"

### 5. **Botão Passar Turno**
```javascript
renderizarBotaoPassarTurno()
```
- Gera botão HTML com estilo integrado
- Ativa função `executarPassarTurno()` ao clicar
- Atualiza UI automaticamente

## 📊 Estrutura de Dados

### Coluna `habilidades` no banco:
```sql
duracao_turnos INTEGER          -- Duração máxima em turnos
turnos_restantes INTEGER        -- Turnos que ainda faltam
ativada_em TIMESTAMP            -- Quando foi ativada
deativada_em TIMESTAMP          -- Quando expirou
```

## 🔄 Fluxo de Combate

1. **Mestre inicia combate**
   - Carrega ficha do personagem
   - Exibe habilidades ativas com barras de duração

2. **Jogador ativa habilidade**
   ```javascript
   await ativarHabilidadeComDuracao(fichaId, habId, 3);
   // Habilidade activa por 3 turnos
   ```

3. **Turno avança** (clica em "Passar Turno")
   ```javascript
   await avancarTurno(fichaId);
   // Todos os turnos são decrementados
   // Habilidades com 0 turnos são desativadas
   // Bônus são recalculados
   ```

4. **Loop até fim de combate**
   - Repete passos 2-3 até fim

## 📍 Integração na UI

### No `controle-combate.html`:
```html
<!-- Botão para passar turno -->
<div id="controls">
    ${renderizarBotaoPassarTurno()}
</div>

<!-- Exibição de habilidades ativas com barras -->
<div id="habilidades-ativas">
    ${habilidades.map(hab => `
        <div class="habilidade">
            <h4>${hab.nome}</h4>
            ${renderizarBarraDuracao(hab)}
        </div>
    `).join('')}
</div>
```

### No `js/controle-combate.js`:
```javascript
// Ao carregar a página
async function carregar() {
    const status = await obterStatusDuracoes(fichaId);
    exibirHabilidadesComDuracao(status.data);
}

// Função de renderização
function exibirHabilidadesComDuracao(habilidades) {
    const container = document.getElementById('habilidades-ativas');
    container.innerHTML = habilidades.map(hab => `
        <div>
            <strong>${hab.nome}</strong>
            ${renderizarBarraDuracao(hab)}
        </div>
    `).join('');
}
```

## 🎨 Cores da Barra de Duração

| Percentual | Cor | Significado |
|-----------|-----|------------|
| > 50% | 🟢 Verde | Muitos turnos restantes |
| 25-50% | 🟡 Amarelo | Poucos turnos restantes |
| ≤ 25% | 🔴 Vermelho | Próximo de expirar |

## ⚠️ Monitoramento Automático

```javascript
await monitorarDuracoes(fichaId);
```
- ⚠️ Alerta quando falta 1 turno
- ❌ Aviso quando expira
- Útil para feedback visual/audio

## 🔧 Exemplos de Uso Completo

### Cenário 1: Ativar "Escudo Mágico" por 2 turnos
```javascript
const resultado = await ativarHabilidadeComDuracao(
    'player-123',
    'escudo-magico-id',
    2  // 2 turnos
);

if (resultado.success) {
    console.log(resultado.mensagem); // "✅ Escudo Mágico ativada por 2 turno(s)!"
    await carregarHabilidades(); // Atualiza UI
}
```

### Cenário 2: Avançar turno após ação
```javascript
// Jogador fez sua ação, passa turno
const resultado = await avancarTurno('player-123');

console.log(`${resultado.habilidadesDesativadas} habilidades expiraram`);

// Se alguma expirou, recalcular UI
if (resultado.habilidadesDesativadas > 0) {
    await carregarHabilidades();
    await loadFicha();
}
```

### Cenário 3: Verificar status antes de exibir
```javascript
const status = await obterStatusDuracoes('player-123');

if (status.success && status.data.length > 0) {
    console.log('Habilidades ativas com duração:');
    status.data.forEach(hab => {
        console.log(`${hab.nome}: ${hab.turnos_restantes}/${hab.duracao_total} turnos`);
    });
}
```

## 📝 Notas Importantes

1. **Recalcular Bônus**: Sempre chamado automaticamente ao passar turno
2. **Recursos**: Desconto ocorre apenas ao ativar, não ao avançar turno
3. **Persistência**: Durações são salvas no banco de dados
4. **Compatibilidade**: Funciona com sistema de activation/deactivation existente

## 🐛 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|--------|
| Habilidades não desativam | `turnos_restantes` não definido | Verificar coluna na BD |
| Bônus não atualizam | `recalcularBonusGlobais` não chamado | Verificar import |
| Botão não funciona | `fichaIdGlobal` não definido | Definir antes de usar |

## 🚀 Próximas Melhorias

- [ ] Animações ao expirar habilidade
- [ ] Sons de alerta
- [ ] Histórico de ativações
- [ ] Mod de duração por itens
- [ ] Efeitos especiais ao ativar
