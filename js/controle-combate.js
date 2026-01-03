let fichaId = null;
let fichaData = null;
let acoes = [];

document.addEventListener('DOMContentLoaded', async function() {
    const params = new URLSearchParams(window.location.search);
    fichaId = params.get('id');
    
    if (!fichaId) {
        alert('Erro: Ficha não encontrada');
        window.close();
        return;
    }
    
    await carregarDados();
    carregarAcoes();
});

async function carregarDados() {
    try {
        const result = await getPersonagemById(fichaId);
        
        if (!result.success) {
            alert('Erro ao carregar ficha');
            window.close();
            return;
        }
        
        fichaData = result.data;
        
        document.getElementById('nomePersonagem').textContent = fichaData.nome || '-';
        document.getElementById('vidaMaxima').textContent = fichaData.vida_maxima || 0;
        document.getElementById('manaMaxima').textContent = fichaData.mana_maxima || 0;
        document.getElementById('estaminaMaxima').textContent = fichaData.estamina_maxima || 0;
        
        document.getElementById('vidaAtual').value = fichaData.vida_atual || 0;
        document.getElementById('manaAtual').value = fichaData.mana_atual || 0;
        document.getElementById('estaminaAtual').value = fichaData.estamina_atual || 0;
        
        atualizarAcerto();
        atualizarEsquiva();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados da ficha');
        window.close();
    }
}

function getAtributoValor(atributo) {
    const base = fichaData[`${atributo}_base`] || 0;
    const bonus = fichaData[`${atributo}_bonus`] || 0;
    return base + bonus;
}

function atualizarAcerto() {
    const atributo = document.getElementById('atributoAcerto').value;
    const valor = getAtributoValor(atributo);
    document.getElementById('acertoBonus').textContent = '0';
    document.getElementById('acertoAtr').textContent = valor;
}

function atualizarEsquiva() {
    const atributo = document.getElementById('atributoEsquiva').value;
    const valor = getAtributoValor(atributo);
    document.getElementById('esquivaBonus').textContent = '0';
    document.getElementById('esquivaAtr').textContent = valor;
}

async function salvarDados() {
    const vidaAtual = parseInt(document.getElementById('vidaAtual').value) || 0;
    const manaAtual = parseInt(document.getElementById('manaAtual').value) || 0;
    const estaminaAtual = parseInt(document.getElementById('estaminaAtual').value) || 0;
    
    try {
        const result = await updatePersonagem(fichaId, {
            vida_atual: vidaAtual,
            mana_atual: manaAtual,
            estamina_atual: estaminaAtual
        });
        
        if (result.success) {
            alert('Dados salvos com sucesso!');
        } else {
            alert('Erro ao salvar dados: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados');
    }
}

function abrirFormularioAcao() {
    const modal = document.createElement('div');
    modal.id = 'acaoModal';
    modal.className = 'modal fade';
    modal.tabIndex = '-1';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                    <h5 class="modal-title">➕ Adicionar Ação</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Tipo de Ação</label>
                        <select id="tipoAcao" class="form-select">
                            <option value="">Selecione...</option>
                            <option value="ataque">⚔️ Ataque</option>
                            <option value="esquiva">🌀 Esquiva</option>
                            <option value="magia">🔮 Magia</option>
                            <option value="defesa">🛡️ Defesa</option>
                            <option value="outro">📌 Outro</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Nome da Ação</label>
                        <input type="text" id="nomeAcao" class="form-control" placeholder="Ex: Golpe Crítico">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Dados (opcional)</label>
                        <input type="text" id="dadosAcao" class="form-control" placeholder="Ex: 1d50, 2d20, d100">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Descrição (opcional)</label>
                        <textarea id="descricaoAcao" class="form-control" rows="3" placeholder="Descreva a ação..."></textarea>
                    </div>
                </div>
                <div class="modal-footer" style="border-top: 1px solid #ddd;">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;" onclick="salvarAcao()">Adicionar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const m = new bootstrap.Modal(modal);
    m.show();
}

function salvarAcao() {
    const tipo = document.getElementById('tipoAcao').value;
    const nome = document.getElementById('nomeAcao').value;
    const dados = document.getElementById('dadosAcao').value;
    const descricao = document.getElementById('descricaoAcao').value;
    
    if (!tipo || !nome) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    const acao = {
        id: Date.now(),
        tipo,
        nome,
        dados,
        descricao
    };
    
    acoes.push(acao);
    salvarAcoesLocalStorage();
    renderizarAcoes();
    
    const modal = document.getElementById('acaoModal');
    if (modal) {
        const m = bootstrap.Modal.getInstance(modal);
        if (m) m.hide();
        modal.remove();
    }
}

function salvarAcoesLocalStorage() {
    localStorage.setItem(`acoes_${fichaId}`, JSON.stringify(acoes));
}

function carregarAcoes() {
    const acoesJSON = localStorage.getItem(`acoes_${fichaId}`);
    acoes = acoesJSON ? JSON.parse(acoesJSON) : [];
    renderizarAcoes();
}

function renderizarAcoes() {
    const container = document.getElementById('acoesContainer');
    
    if (acoes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Nenhuma ação adicionada ainda</p>';
        return;
    }
    
    const emojis = {
        ataque: '⚔️',
        esquiva: '🌀',
        magia: '🔮',
        defesa: '🛡️',
        outro: '📌'
    };
    
    container.innerHTML = acoes.map(acao => `
        <div class="action-item">
            <div>
                <h6>${emojis[acao.tipo] || '📌'} ${acao.nome}</h6>
                ${acao.descricao ? `<p>${acao.descricao}</p>` : ''}
                ${acao.dados ? `<p><strong>Dados:</strong> ${acao.dados}</p>` : ''}
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                ${acao.dados ? `<button class="btn-rolar" onclick="rolarDados('${acao.dados}', ${acao.id})">🎲 Rolar</button>` : ''}
                <button onclick="deletarAcao(${acao.id})" style="background: #ff6b6b; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.85em;">✕</button>
            </div>
        </div>
        <div id="resultado-${acao.id}"></div>
    `).join('');
}

function rolarDados(notacao, acaoId) {
    try {
        const resultado = calcularDados(notacao);
        const container = document.getElementById(`resultado-${acaoId}`);
        container.innerHTML = `<div class="resultado-dados">🎲 Resultado: <strong>${resultado.total}</strong> ${resultado.detalhes}</div>`;
    } catch (error) {
        alert('Formato de dados inválido. Use: 1d50, 2d20, etc');
    }
}

function calcularDados(notacao) {
    const regex = /^(\d+)d(\d+)$/i;
    const match = notacao.trim().match(regex);
    
    if (!match) {
        throw new Error('Formato inválido');
    }
    
    const quantidade = parseInt(match[1]);
    const lados = parseInt(match[2]);
    
    if (quantidade <= 0 || lados <= 0 || quantidade > 100 || lados > 1000) {
        throw new Error('Valores inválidos');
    }
    
    let total = 0;
    const rolls = [];
    
    for (let i = 0; i < quantidade; i++) {
        const roll = Math.floor(Math.random() * lados) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    const detalhes = quantidade > 1 ? `(${rolls.join(' + ')})` : '';
    return { total, detalhes };
}

function deletarAcao(id) {
    acoes = acoes.filter(a => a.id !== id);
    salvarAcoesLocalStorage();
    renderizarAcoes();
}
