// Variável global para armazenar o ID da ficha
let fichaIdGlobal = null;

// Função para obter fichaId da URL
function obterFichaId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Inicializar fichaIdGlobal quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
    // Usar window.fichaId se disponível, senão obter da URL
    fichaIdGlobal = window.fichaId || obterFichaId();
    if (fichaIdGlobal) {
        // Carregar TODOS os itens em paralelo ao invés de sequencialmente
        await Promise.all([
            carregarMagias(),
            carregarHabilidades(),
            carregarConhecimentos(),
            carregarItens(),
            carregarAnotacoes(),
            carregarPassivas()
        ]);
    }
});

// Função para alternar accordion
function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const isOpen = content.style.display === 'block';
    content.style.display = isOpen ? 'none' : 'block';
    
    // Rotacionar seta
    const arrow = button.querySelector('span:last-child');
    if (arrow) {
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        // Transition já está definida no CSS
    }
}

// ============================================
// MAGIAS
// ============================================

async function carregarMagias() {
    const resultado = await obterMagias(fichaIdGlobal);
    const container = document.getElementById('lista-magias');
    
    if (!container) return;

    if (resultado.success && resultado.data.length > 0) {
        container.innerHTML = resultado.data.map(magia => {
            const bonusText = magia.bonus && Array.isArray(magia.bonus) && magia.bonus.length > 0 
                ? magia.bonus.map(b => `${b.valor > 0 ? '+' : ''}${b.valor} ${b.atributo}`).join(', ')
                : '-';
            
            return `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${magia.nome} (Nível ${magia.nivel}) ${magia.ativa ? '🟢' : '🔴'}</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <div class="accordion-stats">
                        <div class="stat-pill"><span class="stat-label">Dano</span><span class="stat-value">${magia.dano || '-'}</span></div>
                        <div class="stat-pill"><span class="stat-label">Efeito</span><span class="stat-value">${magia.efeito || '-'}</span></div>
                        <div class="stat-pill"><span class="stat-label">Mana</span><span class="stat-value">${magia.custo_mana}</span></div>
                        <div class="stat-pill"><span class="stat-label">Estamina</span><span class="stat-value">${magia.custo_estamina || 0}</span></div>
                        <div class="stat-pill"><span class="stat-label">Bônus</span><span class="stat-value">${bonusText}</span></div>
                    </div>
                    <p class="descricao-detalhe"><strong>Descrição:</strong> ${magia.descricao || '-'}</p>
                    ${renderizarBotaoAtivacao(magia, 'magia')}
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarMagia('${magia.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarMagiaUI('${magia.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhuma magia adicionada ainda.</p>';
    }
}

async function deletarMagiaUI(magiaId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar esta magia?');
    if (!confirmed) return;

    const resultado = await deletarMagia(magiaId);
    if (resultado.success) {
        carregarMagias();
        // Recalcular bônus globais após deletar
        await recalcularBonusGlobais(fichaIdGlobal);
    } else {
        console.error('Erro ao deletar magia:', resultado.error);
    }
}

// ============================================
// HABILIDADES
// ============================================

async function carregarHabilidades() {
    const resultado = await obterHabilidades(fichaIdGlobal);
    const container = document.getElementById('lista-habilidades');
    
    if (!container) return;

    if (resultado.success && resultado.data.length > 0) {
        container.innerHTML = resultado.data.map(hab => {
            const bonusText = hab.bonus && Array.isArray(hab.bonus) && hab.bonus.length > 0 
                ? hab.bonus.map(b => `${b.valor > 0 ? '+' : ''}${b.valor} ${b.atributo}`).join(', ')
                : '-';
            
            return `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${hab.nome} (Nível ${hab.nivel}) ${hab.ativa ? '🟢' : '🔴'}</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <div class="accordion-stats">
                        <div class="stat-pill"><span class="stat-label">Dano</span><span class="stat-value">${hab.dano || '-'}</span></div>
                        <div class="stat-pill"><span class="stat-label">Efeito</span><span class="stat-value">${hab.efeito || '-'}</span></div>
                        <div class="stat-pill"><span class="stat-label">Mana</span><span class="stat-value">${hab.custo_mana}</span></div>
                        <div class="stat-pill"><span class="stat-label">Estamina</span><span class="stat-value">${hab.custo_estamina || 0}</span></div>
                        <div class="stat-pill"><span class="stat-label">Bônus</span><span class="stat-value">${bonusText}</span></div>
                    </div>
                    <p class="descricao-detalhe"><strong>Descrição:</strong> ${hab.descricao || '-'}</p>
                    ${renderizarBotaoAtivacao(hab, 'habilidade')}
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarHabilidade('${hab.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarHabilidadeUI('${hab.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhuma habilidade adicionada ainda.</p>';
    }
}

async function deletarHabilidadeUI(habilidadeId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar esta habilidade?');
    if (!confirmed) return;

    const resultado = await deletarHabilidade(habilidadeId);
    if (resultado.success) {
        carregarHabilidades();
        // Recalcular bônus globais após deletar
        await recalcularBonusGlobais(fichaIdGlobal);
    } else {
        console.error('Erro ao deletar habilidade:', resultado.error);
    }
}

// ============================================
// CONHECIMENTOS
// ============================================

async function carregarConhecimentos() {
    const resultado = await obterConhecimentos(fichaIdGlobal);
    const container = document.getElementById('lista-conhecimentos');
    
    if (!container) return;

    if (resultado.success && resultado.data.length > 0) {
        container.innerHTML = resultado.data.map(conhec => {
            const bonusText = conhec.bonus && Array.isArray(conhec.bonus) && conhec.bonus.length > 0 
                ? conhec.bonus.map(b => `${b.valor > 0 ? '+' : ''}${b.valor} ${b.atributo}`).join(', ')
                : '-';
            
            return `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${conhec.nome} (Nível ${conhec.nivel}) ${conhec.ativa ? '🟢' : '🔴'}</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <div class="accordion-stats">
                        <div class="stat-pill"><span class="stat-label">Bônus</span><span class="stat-value">${bonusText}</span></div>
                    </div>
                    <p class="descricao-detalhe"><strong>Descrição:</strong> ${conhec.descricao || '-'}</p>
                    ${renderizarBotaoAtivacao(conhec, 'conhecimento')}
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarConhecimento('${conhec.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarConhecimentoUI('${conhec.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhum conhecimento adicionado ainda.</p>';
    }
}

async function deletarConhecimentoUI(conhecimentoId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar este conhecimento?');
    if (!confirmed) return;

    const resultado = await deletarConhecimento(conhecimentoId);
    if (resultado.success) {
        carregarConhecimentos();
        // Recalcular bônus globais após deletar
        await recalcularBonusGlobais(fichaIdGlobal);
    } else {
        console.error('Erro ao deletar conhecimento:', resultado.error);
    }
}

// ============================================
// ITENS (INVENTÁRIO)
// ============================================

async function carregarItens() {
    const resultado = await obterItens(fichaIdGlobal);
    const container = document.getElementById('lista-itens');
    
    if (!container) return;

    if (resultado.success && resultado.data.length > 0) {
        container.innerHTML = resultado.data.map(item => {
            const bonusText = item.bonus && Array.isArray(item.bonus) && item.bonus.length > 0 
                ? item.bonus.map(b => `${b.valor > 0 ? '+' : ''}${b.valor} ${b.atributo}`).join(', ')
                : '-';
            
            return `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${item.nome} (x${item.quantidade}) ${item.ativa ? '🟢' : '🔴'}</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <div class="accordion-stats">
                        <div class="stat-pill"><span class="stat-label">Qtd</span><span class="stat-value">${item.quantidade}</span></div>
                        <div class="stat-pill"><span class="stat-label">Peso</span><span class="stat-value">${item.peso} kg</span></div>
                        <div class="stat-pill"><span class="stat-label">Bônus</span><span class="stat-value">${bonusText}</span></div>
                    </div>
                    <p class="descricao-detalhe"><strong>Descrição:</strong> ${item.descricao || '-'}</p>
                    ${renderizarBotaoAtivacao(item, 'item')}
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarItem('${item.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarItemUI('${item.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Inventário vazio.</p>';
    }
}

async function deletarItemUI(itemId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar este item?');
    if (!confirmed) return;

    const resultado = await deletarItem(itemId);
    if (resultado.success) {
        carregarItens();
        // Recalcular bônus globais após deletar
        await recalcularBonusGlobais(fichaIdGlobal);
    } else {
        console.error('Erro ao deletar item:', resultado.error);
    }
}

// ============================================
// ANOTAÇÕES
// ============================================

async function carregarAnotacoes() {
    const resultado = await obterAnotacoes(fichaIdGlobal);
    const container = document.getElementById('lista-anotacoes');
    
    if (!container) return;

    if (resultado.success && resultado.data.length > 0) {
        container.innerHTML = resultado.data.map(anotacao => `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${anotacao.titulo}</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <p><strong>Descrição:</strong> ${anotacao.descricao}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarAnotacao('${anotacao.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarAnotacaoUI('${anotacao.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhuma anotação adicionada ainda.</p>';
    }
}

async function deletarAnotacaoUI(anotacaoId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar esta anotação?');
    if (!confirmed) return;

    const resultado = await deletarAnotacao(anotacaoId);
    if (resultado.success) {
        carregarAnotacoes();
    } else {
        console.error('Erro ao deletar anotação:', resultado.error);
    }
}

// ============================================
// PASSIVAS
// ============================================

async function carregarPassivas() {
    const resultado = await obterPassivas(fichaIdGlobal);
    const container = document.getElementById('lista-passivas');

    if (!container) return;

    if (resultado.success && resultado.data.length > 0) {
        // Get active passivas
        const { data: personagem } = await supabase
            .from('personagens')
            .select('passivas_ativas')
            .eq('id', fichaIdGlobal)
            .single();
        
        const passivasAtivas = personagem?.passivas_ativas || [];
        
        container.innerHTML = resultado.data.map(passiva => {
            const bonusText = passiva.bonus && Array.isArray(passiva.bonus) && passiva.bonus.length > 0 
                ? passiva.bonus.map(b => `${b.valor > 0 ? '+' : ''}${b.valor} ${b.atributo}`).join(', ')
                : '-';
            
            const estaAtiva = passivasAtivas.includes(passiva.nome);
            const statusClass = estaAtiva ? 'active' : 'inactive';
            const statusTexto = estaAtiva ? '✅ Ativo' : '❌ Inativo';
            const botaoTexto = estaAtiva ? '🔴 Desativar' : '🟢 Ativar';
            const botaoCor = estaAtiva ? '#ff6b6b' : '#51cf66';
            
            return `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${passiva.nome}</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <div class="accordion-stats">
                        <div class="stat-pill"><span class="stat-label">Categoria</span><span class="stat-value">${passiva.categoria || '-'}</span></div>
                        <div class="stat-pill"><span class="stat-label">Efeito</span><span class="stat-value">${passiva.efeito || '-'}</span></div>
                        <div class="stat-pill"><span class="stat-label">Bônus</span><span class="stat-value">${bonusText}</span></div>
                    </div>
                    <p class="descricao-detalhe"><strong>Descrição:</strong> ${passiva.descricao || '-'}</p>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
                        <span style="font-size: 12px; color: #e0e0e0;">${statusTexto}</span>
                        <button onclick="alternarAtivacao('passiva', '${passiva.nome}')" style="background: ${botaoCor}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap;">
                            ${botaoTexto}
                        </button>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarPassiva('${passiva.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarPassivaUI('${passiva.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhuma passiva adicionada ainda.</p>';
    }
}

async function deletarPassivaUI(passivaId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar esta passiva?');
    if (!confirmed) return;

    const resultado = await deletarPassiva(fichaIdGlobal, passivaId);
    if (resultado.success) {
        carregarPassivas();
        // Recalcular bônus globais após deletar
        await recalcularBonusGlobais(fichaIdGlobal);
    } else {
        console.error('Erro ao deletar passiva:', resultado.error);
    }
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let editandoMagiaId = null;
let editandoHabilidadeId = null;
let editandoConhecimentoId = null;
let editandoItemId = null;
let editandoAnotacaoId = null;
let editandoPassivaId = null;

// ============================================
// FUNÇÕES DE BÔNUS
// ============================================

const atributosDisponiveis = [
    { value: 'forca_bonus', text: 'Força' },
    { value: 'agilidade_bonus', text: 'Agilidade' },
    { value: 'sorte_bonus', text: 'Sorte' },
    { value: 'inteligencia_bonus', text: 'Inteligência' },
    { value: 'corpo_essencia_bonus', text: 'Corpo Essência' },
    { value: 'exposicao_runica_bonus', text: 'Exposição Rúnica' },
    { value: 'vida_maxima_bonus', text: 'Vida Máxima' },
    { value: 'mana_maxima_bonus', text: 'Mana Máxima' },
    { value: 'estamina_maxima_bonus', text: 'Estamina Máxima' },
    { value: 'esquiva_bonus', text: 'Esquiva' },
    { value: 'acerto_bonus', text: 'Acerto' }
];

function adicionarBonus(tipo, bonus = { atributo: '', valor: 0 }) {
    const container = document.getElementById(`${tipo}-bonus-container`);
    if (!container) return;

    const bonusId = `bonus-${tipo}-${Date.now()}`;
    const bonusWrapper = document.createElement('div');
    bonusWrapper.className = 'bonus-item';
    bonusWrapper.id = bonusId;
    bonusWrapper.style.display = 'flex';
    bonusWrapper.style.gap = '10px';
    bonusWrapper.style.marginBottom = '10px';

    const select = document.createElement('select');
    select.className = 'bonus-atributo';
    select.style = "flex: 2; padding: 8px; background: #1a2a4e; border: 1px solid #667eea; color: #e0e0e0; border-radius: 4px;";
    atributosDisponiveis.forEach(attr => {
        const option = document.createElement('option');
        option.value = attr.value;
        option.textContent = attr.text;
        if (attr.value === bonus.atributo) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'bonus-valor';
    input.value = bonus.valor;
    input.style = "flex: 1; padding: 8px; background: #1a2a4e; border: 1px solid #667eea; color: #e0e0e0; border-radius: 4px;";

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '🗑️';
    removeBtn.style = "padding: 8px 12px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;";
    removeBtn.onclick = () => document.getElementById(bonusId).remove();

    bonusWrapper.appendChild(select);
    bonusWrapper.appendChild(input);
    bonusWrapper.appendChild(removeBtn);
    container.appendChild(bonusWrapper);
}


// ============================================
// MODAIS - ABRIR
// ============================================

function abrirModalMagia() {
    const modal = document.getElementById('modal-magia');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Scroll suave após renderizar
    requestAnimationFrame(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function fecharModalMagia() {
    document.getElementById('modal-magia').style.display = 'none';
    document.getElementById('form-magia').reset();
    document.getElementById('magia-bonus-container').innerHTML = ''; // Limpar bônus
    editandoMagiaId = null;
    document.body.style.overflow = 'auto';
}

function abrirModalHabilidade() {
    const modal = document.getElementById('modal-habilidade');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Scroll suave após renderizar
    requestAnimationFrame(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function fecharModalHabilidade() {
    document.getElementById('modal-habilidade').style.display = 'none';
    document.getElementById('form-habilidade').reset();
    document.getElementById('habilidade-bonus-container').innerHTML = '';
    editandoHabilidadeId = null;
    document.body.style.overflow = 'auto';
}

function abrirModalConhecimento() {
    const modal = document.getElementById('modal-conhecimento');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Scroll suave após renderizar
    requestAnimationFrame(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function fecharModalConhecimento() {
    document.getElementById('modal-conhecimento').style.display = 'none';
    document.getElementById('form-conhecimento').reset();
    document.getElementById('conhecimento-bonus-container').innerHTML = '';
    editandoConhecimentoId = null;
    document.body.style.overflow = 'auto';
}

function abrirModalItem() {
    const modal = document.getElementById('modal-item');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Scroll suave após renderizar
    requestAnimationFrame(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function fecharModalItem() {
    document.getElementById('modal-item').style.display = 'none';
    document.getElementById('form-item').reset();
    document.getElementById('item-bonus-container').innerHTML = '';
    editandoItemId = null;
    document.body.style.overflow = 'auto';
}

function abrirModalAnotacao() {
    const modal = document.getElementById('modal-anotacao');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Scroll suave após renderizar
    requestAnimationFrame(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function fecharModalAnotacao() {
    document.getElementById('modal-anotacao').style.display = 'none';
    document.getElementById('form-anotacao').reset();
    editandoAnotacaoId = null;
    document.body.style.overflow = 'auto';
}

function abrirModalPassiva() {
    const modal = document.getElementById('modal-passiva');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Scroll suave após renderizar
    requestAnimationFrame(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function fecharModalPassiva() {
    document.getElementById('modal-passiva').style.display = 'none';
    document.getElementById('form-passiva').reset();
    document.getElementById('passiva-bonus-container').innerHTML = '';
    editandoPassivaId = null;
    document.body.style.overflow = 'auto';
}

// ============================================
// SALVAR ITENS
// ============================================

async function salvarMagia() {
    const nome = document.getElementById('magia-nome')?.value;
    const dano = document.getElementById('magia-dano')?.value;
    const efeito = document.getElementById('magia-efeito')?.value;
    const descricao = document.getElementById('magia-descricao')?.value;
    const custo_mana = document.getElementById('magia-custo-mana')?.value;
    const custo_estamina = document.getElementById('magia-custo-estamina')?.value;
    const nivelInput = document.getElementById('magia-nivel');
    const nivel = nivelInput ? nivelInput.value : 1;

    if (!nome) {
        console.warn('O nome da magia é obrigatório!');
        return;
    }

    // Coletar bônus
    const bonusContainer = document.getElementById('magia-bonus-container');
    const bonusItems = bonusContainer.querySelectorAll('.bonus-item');
    const bonus = Array.from(bonusItems).map(item => {
        const atributo = item.querySelector('.bonus-atributo').value;
        const valor = parseInt(item.querySelector('.bonus-valor').value) || 0;
        return { atributo, valor };
    });

    const dadosMagia = {
        nome,
        dano,
        efeito,
        descricao,
        custo_mana: parseInt(custo_mana) || 0,
        custo_estamina: parseInt(custo_estamina) || 0,
        nivel: parseInt(nivel) || 1,
        bonus // Adiciona o array de bônus
    };

    let resultado;
    if (editandoMagiaId) {
        resultado = await atualizarMagia(editandoMagiaId, dadosMagia);
    } else {
        const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
        if (!fichaId) {
            console.error('Erro: ID da ficha não encontrado!');
            return;
        }
        resultado = await adicionarMagia(fichaId, dadosMagia);
    }

    if (resultado.success) {
        fecharModalMagia();
        carregarMagias();
        // Recalcular bônus globais
        await recalcularBonusGlobais(fichaIdGlobal);
        // Recarregar ficha em tempo real
        if (typeof loadFicha === 'function') {
            await loadFicha();
        }
        editandoMagiaId = null;
    } else {
        console.error('Erro ao salvar magia:', resultado.error);
    }
}

async function salvarHabilidade() {
    const nome = document.getElementById('habilidade-nome')?.value;
    const dano = document.getElementById('habilidade-dano')?.value;
    const efeito = document.getElementById('habilidade-efeito')?.value;
    const descricao = document.getElementById('habilidade-descricao')?.value;
    const custo_mana = document.getElementById('habilidade-custo-mana')?.value;
    const custo_estamina = document.getElementById('habilidade-custo-estamina')?.value;
    const habNivelInput = document.getElementById('habilidade-nivel');
    const nivel = habNivelInput ? habNivelInput.value : 1;

    if (!nome || !dano) {
        console.warn('Preencha os campos obrigatórios de habilidade!');
        return;
    }

    // Coletar bônus
    const bonusContainer = document.getElementById('habilidade-bonus-container');
    const bonusItems = bonusContainer?.querySelectorAll('.bonus-item') || [];
    const bonus = Array.from(bonusItems).map(item => {
        const atributo = item.querySelector('.bonus-atributo').value;
        const valor = parseInt(item.querySelector('.bonus-valor').value) || 0;
        return { atributo, valor };
    });

    // Se está editando, atualiza ao invés de adicionar
    if (editandoHabilidadeId) {
        const resultado = await atualizarHabilidade(editandoHabilidadeId, {
            nome,
            dano,
            efeito,
            descricao,
            custo_mana: parseInt(custo_mana) || 0,
            custo_estamina: parseInt(custo_estamina) || 0,
            nivel: parseInt(nivel) || 1,
            bonus
        });

        if (resultado.success) {
            fecharModalHabilidade();
            carregarHabilidades();
            editandoHabilidadeId = null;
            // Recalcular bônus globais
            await recalcularBonusGlobais(fichaIdGlobal);
            // Recarregar ficha em tempo real
            if (typeof loadFicha === 'function') {
                await loadFicha();
            }
        } else {
            console.error('Erro ao atualizar habilidade:', resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        console.error('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarHabilidade(fichaId, {
        nome,
        dano,
        efeito,
        descricao,
        custo_mana: parseInt(custo_mana) || 0,
        custo_estamina: parseInt(custo_estamina) || 0,
        nivel: parseInt(nivel) || 1,
        bonus
    });

    if (resultado.success) {
        fecharModalHabilidade();
        carregarHabilidades();
        // Recalcular bônus globais
        await recalcularBonusGlobais(fichaIdGlobal);
        // Recarregar ficha em tempo real
        if (typeof loadFicha === 'function') {
            await loadFicha();
        }
    } else {
        console.error('Erro ao adicionar habilidade:', resultado.error);
    }
}

async function salvarConhecimento() {
    const nome = document.getElementById('conhecimento-nome')?.value;
    const descricao = document.getElementById('conhecimento-descricao')?.value;
    const conhecNivelInput = document.getElementById('conhecimento-nivel');
    const nivel = conhecNivelInput ? conhecNivelInput.value : 1;

    if (!nome) {
        console.warn('Preencha o nome do conhecimento!');
        return;
    }

    // Coletar bônus
    const bonusContainer = document.getElementById('conhecimento-bonus-container');
    const bonusItems = bonusContainer?.querySelectorAll('.bonus-item') || [];
    const bonus = Array.from(bonusItems).map(item => {
        const atributo = item.querySelector('.bonus-atributo').value;
        const valor = parseInt(item.querySelector('.bonus-valor').value) || 0;
        return { atributo, valor };
    });

    // Se está editando, atualiza ao invés de adicionar
    if (editandoConhecimentoId) {
        const resultado = await atualizarConhecimento(editandoConhecimentoId, {
            nome,
            descricao,
            nivel: parseInt(nivel) || 1,
            bonus
        });

        if (resultado.success) {
            fecharModalConhecimento();
            carregarConhecimentos();
            editandoConhecimentoId = null;
            // Recalcular bônus globais
            await recalcularBonusGlobais(fichaIdGlobal);
            // Recarregar ficha em tempo real
            if (typeof loadFicha === 'function') {
                await loadFicha();
            }
        } else {
            console.error('Erro ao atualizar conhecimento:', resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        console.error('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarConhecimento(fichaId, {
        nome,
        descricao,
        nivel: parseInt(nivel) || 1,
        bonus
    });

    if (resultado.success) {
        fecharModalConhecimento();
        carregarConhecimentos();
        // Recalcular bônus globais
        await recalcularBonusGlobais(fichaIdGlobal);
        // Recarregar ficha em tempo real
        if (typeof loadFicha === 'function') {
            await loadFicha();
        }
    } else {
        console.error('Erro ao adicionar conhecimento:', resultado.error);
    }
}

async function salvarItem() {
    const nome = document.getElementById('item-nome')?.value;
    const quantidade = document.getElementById('item-quantidade')?.value;
    const descricao = document.getElementById('item-descricao')?.value;
    const peso = document.getElementById('item-peso')?.value;

    if (!nome || !quantidade) {
        console.warn('Preencha os campos obrigatórios do item!');
        return;
    }

    // Coletar bônus
    const bonusContainer = document.getElementById('item-bonus-container');
    const bonusItems = bonusContainer?.querySelectorAll('.bonus-item') || [];
    const bonus = Array.from(bonusItems).map(item => {
        const atributo = item.querySelector('.bonus-atributo').value;
        const valor = parseInt(item.querySelector('.bonus-valor').value) || 0;
        return { atributo, valor };
    });

    // Se está editando, atualiza ao invés de adicionar
    if (editandoItemId) {
        const resultado = await atualizarItem(editandoItemId, {
            nome,
            quantidade: parseInt(quantidade) || 1,
            descricao,
            peso: parseFloat(peso) || 0,
            bonus
        });

        if (resultado.success) {
            fecharModalItem();
            carregarItens();
            editandoItemId = null;
            // Recalcular bônus globais
            await recalcularBonusGlobais(fichaIdGlobal);
            // Recarregar ficha em tempo real
            if (typeof loadFicha === 'function') {
                await loadFicha();
            }
        } else {
            console.error('Erro ao atualizar item:', resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        console.error('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarItem(fichaId, {
        nome,
        quantidade: parseInt(quantidade) || 1,
        descricao,
        peso: parseFloat(peso) || 0,
        bonus
    });

    if (resultado.success) {
        fecharModalItem();
        carregarItens();
        // Recalcular bônus globais
        await recalcularBonusGlobais(fichaIdGlobal);
        // Recarregar ficha em tempo real
        if (typeof loadFicha === 'function') {
            await loadFicha();
        }
    } else {
        console.error('Erro ao adicionar item:', resultado.error);
    }
}

async function salvarAnotacao() {
    const titulo = document.getElementById('anotacao-titulo')?.value;
    const descricao = document.getElementById('anotacao-descricao')?.value;

    if (!titulo) {
        console.warn('Preencha o título da anotação!');
        return;
    }

    // Se está editando, atualiza ao invés de adicionar
    if (editandoAnotacaoId) {
        const resultado = await atualizarAnotacao(editandoAnotacaoId, {
            titulo,
            descricao
        });

        if (resultado.success) {
            fecharModalAnotacao();
            carregarAnotacoes();
            editandoAnotacaoId = null;
        } else {
            console.error('Erro ao atualizar anotação:', resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        console.error('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarAnotacao(fichaId, {
        titulo,
        descricao
    });

    if (resultado.success) {
        fecharModalAnotacao();
        carregarAnotacoes();
    } else {
        console.error('Erro ao adicionar anotação:', resultado.error);
    }
}

async function salvarPassiva() {
    const nome = document.getElementById('passiva-nome')?.value;
    const categoria = document.getElementById('passiva-categoria')?.value;
    const efeito = document.getElementById('passiva-efeito')?.value;
    const descricao = document.getElementById('passiva-descricao')?.value;

    if (!nome) {
        console.warn('Preencha o nome da passiva!');
        return;
    }

    // Coletar bônus
    const bonusContainer = document.getElementById('passiva-bonus-container');
    const bonusItems = bonusContainer?.querySelectorAll('.bonus-item') || [];
    const bonus = Array.from(bonusItems).map(item => {
        const atributo = item.querySelector('.bonus-atributo').value;
        const valor = parseInt(item.querySelector('.bonus-valor').value) || 0;
        return { atributo, valor };
    });

    // Se está editando, atualiza ao invés de adicionar
    if (editandoPassivaId) {
        const resultado = await atualizarPassiva(fichaIdGlobal, editandoPassivaId, {
            nome,
            categoria,
            efeito,
            bonus,
            descricao
        });

        if (resultado.success) {
            fecharModalPassiva();
            carregarPassivas();
            editandoPassivaId = null;
            // Recalcular bônus globais
            await recalcularBonusGlobais(fichaIdGlobal);
            // Recarregar ficha em tempo real
            if (typeof loadFicha === 'function') {
                await loadFicha();
            }
        } else {
            console.error('Erro ao atualizar passiva:', resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        console.error('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarPassiva(fichaId, {
        nome,
        categoria,
        efeito,
        bonus,
        descricao
    });

    if (resultado.success) {
        fecharModalPassiva();
        carregarPassivas();
        // Recalcular bônus globais
        await recalcularBonusGlobais(fichaIdGlobal);
        // Recarregar ficha em tempo real
        if (typeof loadFicha === 'function') {
            await loadFicha();
        }
    } else {
        console.error('Erro ao adicionar passiva:', resultado.error);
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-magia') fecharModalMagia();
    if (e.target.id === 'modal-habilidade') fecharModalHabilidade();
    if (e.target.id === 'modal-conhecimento') fecharModalConhecimento();
    if (e.target.id === 'modal-item') fecharModalItem();
    if (e.target.id === 'modal-anotacao') fecharModalAnotacao();
    if (e.target.id === 'modal-passiva') fecharModalPassiva();
});

// ============================================
// FUNÇÕES DE FILTRO/BUSCA
// ============================================

function filtrarMagias() {
    const busca = document.getElementById('busca-magias')?.value.toLowerCase() || '';
    const container = document.getElementById('lista-magias');
    const items = container.querySelectorAll('.accordion-item');
    let temResultados = false;
    
    items.forEach(item => {
        const nome = item.querySelector('.accordion-header span:first-child')?.textContent.toLowerCase() || '';
        if (busca === '' || nome.includes(busca)) {
            item.style.display = 'block';
            temResultados = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (!temResultados && busca !== '') {
        if (!container.querySelector('.sem-resultados')) {
            const msg = document.createElement('p');
            msg.className = 'sem-resultados';
            msg.style.color = '#b0b0b0';
            msg.textContent = 'Nenhuma magia encontrada.';
            container.appendChild(msg);
        }
    } else {
        const msg = container.querySelector('.sem-resultados');
        if (msg) msg.remove();
    }
}

function filtrarHabilidades() {
    const busca = document.getElementById('busca-habilidades')?.value.toLowerCase() || '';
    const container = document.getElementById('lista-habilidades');
    const items = container.querySelectorAll('.accordion-item');
    let temResultados = false;
    
    items.forEach(item => {
        const nome = item.querySelector('.accordion-header span:first-child')?.textContent.toLowerCase() || '';
        if (busca === '' || nome.includes(busca)) {
            item.style.display = 'block';
            temResultados = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (!temResultados && busca !== '') {
        if (!container.querySelector('.sem-resultados')) {
            const msg = document.createElement('p');
            msg.className = 'sem-resultados';
            msg.style.color = '#b0b0b0';
            msg.textContent = 'Nenhuma habilidade encontrada.';
            container.appendChild(msg);
        }
    } else {
        const msg = container.querySelector('.sem-resultados');
        if (msg) msg.remove();
    }
}

function filtrarConhecimentos() {
    const busca = document.getElementById('busca-conhecimentos')?.value.toLowerCase() || '';
    const container = document.getElementById('lista-conhecimentos');
    const items = container.querySelectorAll('.accordion-item');
    let temResultados = false;
    
    items.forEach(item => {
        const nome = item.querySelector('.accordion-header span:first-child')?.textContent.toLowerCase() || '';
        if (busca === '' || nome.includes(busca)) {
            item.style.display = 'block';
            temResultados = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (!temResultados && busca !== '') {
        if (!container.querySelector('.sem-resultados')) {
            const msg = document.createElement('p');
            msg.className = 'sem-resultados';
            msg.style.color = '#b0b0b0';
            msg.textContent = 'Nenhum conhecimento encontrado.';
            container.appendChild(msg);
        }
    } else {
        const msg = container.querySelector('.sem-resultados');
        if (msg) msg.remove();
    }
}

function filtrarItens() {
    const busca = document.getElementById('busca-itens')?.value.toLowerCase() || '';
    const container = document.getElementById('lista-itens');
    const items = container.querySelectorAll('.accordion-item');
    let temResultados = false;
    
    items.forEach(item => {
        const nome = item.querySelector('.accordion-header span:first-child')?.textContent.toLowerCase() || '';
        if (busca === '' || nome.includes(busca)) {
            item.style.display = 'block';
            temResultados = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (!temResultados && busca !== '') {
        if (!container.querySelector('.sem-resultados')) {
            const msg = document.createElement('p');
            msg.className = 'sem-resultados';
            msg.style.color = '#b0b0b0';
            msg.textContent = 'Nenhum item encontrado.';
            container.appendChild(msg);
        }
    } else {
        const msg = container.querySelector('.sem-resultados');
        if (msg) msg.remove();
    }
}

function filtrarAnotacoes() {
    const busca = document.getElementById('busca-anotacoes')?.value.toLowerCase() || '';
    const container = document.getElementById('lista-anotacoes');
    const items = container.querySelectorAll('.accordion-item');
    let temResultados = false;
    
    items.forEach(item => {
        const nome = item.querySelector('.accordion-header span:first-child')?.textContent.toLowerCase() || '';
        if (busca === '' || nome.includes(busca)) {
            item.style.display = 'block';
            temResultados = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (!temResultados && busca !== '') {
        if (!container.querySelector('.sem-resultados')) {
            const msg = document.createElement('p');
            msg.className = 'sem-resultados';
            msg.style.color = '#b0b0b0';
            msg.textContent = 'Nenhuma anotação encontrada.';
            container.appendChild(msg);
        }
    } else {
        const msg = container.querySelector('.sem-resultados');
        if (msg) msg.remove();
    }
}


// ============================================
// FUNÇÕES DE EDIÇÃO
// ============================================

async function editarMagia(magiaId) {
    const resultado = await obterMagia(magiaId);
    if (!resultado.success) {
        console.error('Erro ao carregar magia:', resultado.error);
        return;
    }
    const magia = resultado.data;
    editandoMagiaId = magiaId;

    document.getElementById('magia-nome').value = magia.nome;
    document.getElementById('magia-dano').value = magia.dano;
    document.getElementById('magia-efeito').value = magia.efeito || '';
    document.getElementById('magia-descricao').value = magia.descricao || '';
    document.getElementById('magia-custo-mana').value = magia.custo_mana || 0;
    document.getElementById('magia-custo-estamina').value = magia.custo_estamina || 0;
    const magiaInputNivel = document.getElementById('magia-nivel');
    if (magiaInputNivel) magiaInputNivel.value = magia.nivel || 1;

    // Limpar e popular bônus
    const bonusContainer = document.getElementById('magia-bonus-container');
    bonusContainer.innerHTML = '';
    if (magia.bonus && Array.isArray(magia.bonus)) {
        magia.bonus.forEach(b => adicionarBonus('magia', b));
    }
    
    abrirModalMagia();
}

async function editarHabilidade(habilidadeId) {
    const resultado = await obterHabilidade(habilidadeId);
    if (!resultado.success) {
        console.error('Erro ao carregar habilidade:', resultado.error);
        return;
    }
    const hab = resultado.data;
    editandoHabilidadeId = habilidadeId;
    document.getElementById('habilidade-nome').value = hab.nome;
    document.getElementById('habilidade-dano').value = hab.dano;
    document.getElementById('habilidade-efeito').value = hab.efeito || '';
    document.getElementById('habilidade-descricao').value = hab.descricao || '';
    document.getElementById('habilidade-custo-mana').value = hab.custo_mana || 0;
    document.getElementById('habilidade-custo-estamina').value = hab.custo_estamina || 0;
    const habInputNivel = document.getElementById('habilidade-nivel');
    if (habInputNivel) habInputNivel.value = hab.nivel || 1;
    
    // Limpar e popular bônus
    const bonusContainer = document.getElementById('habilidade-bonus-container');
    bonusContainer.innerHTML = '';
    if (hab.bonus && Array.isArray(hab.bonus)) {
        hab.bonus.forEach(b => adicionarBonus('habilidade', b));
    }
    
    abrirModalHabilidade();
}

async function editarConhecimento(conhecimentoId) {
    const resultado = await obterConhecimento(conhecimentoId);
    if (!resultado.success) {
        console.error('Erro ao carregar conhecimento:', resultado.error);
        return;
    }
    const conhec = resultado.data;
    editandoConhecimentoId = conhecimentoId;
    document.getElementById('conhecimento-nome').value = conhec.nome;
    document.getElementById('conhecimento-descricao').value = conhec.descricao || '';
    const conhecInputNivel = document.getElementById('conhecimento-nivel');
    if (conhecInputNivel) conhecInputNivel.value = conhec.nivel || 1;
    
    // Limpar e popular bônus
    const bonusContainer = document.getElementById('conhecimento-bonus-container');
    bonusContainer.innerHTML = '';
    if (conhec.bonus && Array.isArray(conhec.bonus)) {
        conhec.bonus.forEach(b => adicionarBonus('conhecimento', b));
    }
    
    abrirModalConhecimento();
}

async function editarItem(itemId) {
    const resultado = await obterItem(itemId);
    if (!resultado.success) {
        console.error('Erro ao carregar item:', resultado.error);
        return;
    }
    const item = resultado.data;
    editandoItemId = itemId;
    document.getElementById('item-nome').value = item.nome;
    document.getElementById('item-quantidade').value = item.quantidade || 1;
    document.getElementById('item-descricao').value = item.descricao || '';
    document.getElementById('item-peso').value = item.peso || 0;
    
    // Limpar e popular bônus
    const bonusContainer = document.getElementById('item-bonus-container');
    bonusContainer.innerHTML = '';
    if (item.bonus && Array.isArray(item.bonus)) {
        item.bonus.forEach(b => adicionarBonus('item', b));
    }
    
    abrirModalItem();
}

async function editarAnotacao(anotacaoId) {
    const resultado = await obterAnotacao(anotacaoId);
    if (!resultado.success) {
        console.error('Erro ao carregar anotação:', resultado.error);
        return;
    }
    const anotacao = resultado.data;
    editandoAnotacaoId = anotacaoId;
    document.getElementById('anotacao-titulo').value = anotacao.titulo;
    document.getElementById('anotacao-descricao').value = anotacao.descricao || '';

    abrirModalAnotacao();
}

async function editarPassiva(passivaId) {
    const resultado = await obterPassiva(fichaIdGlobal, passivaId);
    if (!resultado.success) {
        console.error('Erro ao carregar passiva:', resultado.error);
        return;
    }
    const passiva = resultado.data;
    editandoPassivaId = passivaId;
    document.getElementById('passiva-nome').value = passiva.nome;
    document.getElementById('passiva-categoria').value = passiva.categoria || '';
    document.getElementById('passiva-efeito').value = passiva.efeito || '';
    document.getElementById('passiva-descricao').value = passiva.descricao || '';

    // Limpar e popular bônus
    const bonusContainer = document.getElementById('passiva-bonus-container');
    bonusContainer.innerHTML = '';
    if (passiva.bonus && Array.isArray(passiva.bonus)) {
        passiva.bonus.forEach(b => adicionarBonus('passiva', b));
    }

    abrirModalPassiva();
}

// ============================================
// FUNÇÕES DE ATIVAÇÃO/DESATIVAÇÃO
// ============================================

/**
 * Renderiza botão de ativar/desativar para habilidades
 */
function renderizarBotaoAtivacao(item, tipo) {
    const statusClass = item.ativa ? 'active' : 'inactive';
    const statusTexto = item.ativa ? '✅ Ativo' : '❌ Inativo';
    const botaoTexto = item.ativa ? '🔴 Desativar' : '🟢 Ativar';
    const botaoCor = item.ativa ? '#ff6b6b' : '#51cf66';
    
    // Se tem custo de mana/estamina, mostrar aviso
    const custoBadge = (item.custo_mana || item.custo_estamina) 
        ? `<span style="font-size: 10px; color: #ffd700; margin-left: 5px;">⚡ Gasta ${item.custo_mana || 0} Mana / ${item.custo_estamina || 0} Estamina</span>`
        : '';

    return `
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
            <span style="font-size: 12px; color: #e0e0e0;">${statusTexto} ${custoBadge}</span>
            <button onclick="alternarAtivacao('${tipo}', '${item.id}')" style="background: ${botaoCor}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap;">
                ${botaoTexto}
            </button>
        </div>
    `;
}

/**
 * Alterna ativação/desativação de qualquer tipo de item
 */
async function alternarAtivacao(tipo, itemId) {
    try {
        let resultado;
        
        if (tipo === 'magia') {
            const { data: magia } = await supabase.from('magias').select('ativa').eq('id', itemId).single();
            resultado = magia.ativa ? await desativarMagia(fichaIdGlobal, itemId) : await ativarMagia(fichaIdGlobal, itemId);
        } else if (tipo === 'habilidade') {
            const { data: hab } = await supabase.from('habilidades').select('ativa').eq('id', itemId).single();
            resultado = hab.ativa ? await desativarHabilidade(fichaIdGlobal, itemId) : await ativarHabilidade(fichaIdGlobal, itemId);
        } else if (tipo === 'conhecimento') {
            const { data: con } = await supabase.from('conhecimentos').select('ativa').eq('id', itemId).single();
            resultado = con.ativa ? await desativarConhecimento(fichaIdGlobal, itemId) : await ativarConhecimento(fichaIdGlobal, itemId);
        } else if (tipo === 'item') {
            const { data: item } = await supabase.from('inventario').select('ativa').eq('id', itemId).single();
            resultado = item.ativa ? await desativarItem(fichaIdGlobal, itemId) : await ativarItem(fichaIdGlobal, itemId);
        } else if (tipo === 'passiva') {
            const { data: personagem } = await supabase.from('personagens').select('passivas_ativas').eq('id', fichaIdGlobal).single();
            const passivasAtivas = personagem?.passivas_ativas || [];
            resultado = passivasAtivas.includes(itemId) ? await desativarPassiva(fichaIdGlobal, itemId) : await ativarPassiva(fichaIdGlobal, itemId);
        }

        if (resultado.success) {
            console.log('✅', resultado.mensagem);
            
            // Recarregar a lista correspondente
            if (tipo === 'magia') carregarMagias();
            else if (tipo === 'habilidade') carregarHabilidades();
            else if (tipo === 'conhecimento') carregarConhecimentos();
            else if (tipo === 'item') carregarItens();
            else if (tipo === 'passiva') carregarPassivas();
            
            // IMPORTANTE: Recalcular bônus globais após ativação/desativação
            await recalcularBonusGlobais(fichaIdGlobal);
            
            // Recarregar a ficha para refletir os bônus atualizados
            if (typeof loadFicha === 'function') {
                await loadFicha();
            }
            
            // Se tem gasto de recursos, atualizar estatísticas
            if (resultado.novaMana !== undefined) {
                console.log(`📊 Mana: ${resultado.novaMana} | Estamina: ${resultado.novaEstamina}`);
                // Você pode emitir um evento ou atualizar a UI da ficha aqui
            }
        } else {
            console.error('❌', resultado.error, resultado.detalhe || '');
        }
    } catch (error) {
        console.error('Erro ao alternar ativação:', error.message);
    }
}

