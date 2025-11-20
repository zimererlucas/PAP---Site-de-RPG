// Variável global para armazenar o ID da ficha
let fichaIdGlobal = null;

// Função para obter fichaId da URL
function obterFichaId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Inicializar fichaIdGlobal quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Usar window.fichaId se disponível, senão obter da URL
    fichaIdGlobal = window.fichaId || obterFichaId();
    if (fichaIdGlobal) {
        carregarMagias();
        carregarHabilidades();
        carregarConhecimentos();
        carregarItens();
        carregarAnotacoes();
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
        arrow.style.transition = 'transform 0.3s ease';
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
        container.innerHTML = resultado.data.map(magia => `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${magia.nome} (Nível ${magia.nivel})</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <p><strong>Dano:</strong> ${magia.dano}</p>
                    <p><strong>Efeito:</strong> ${magia.efeito || '-'}</p>
                    <p><strong>Mana:</strong> ${magia.custo_mana}</p>
                    <p><strong>Estamina:</strong> ${magia.custo_estamina || 0}</p>
                    <p><strong>Descrição:</strong> ${magia.descricao}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarMagia('${magia.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarMagiaUI('${magia.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhuma magia adicionada ainda.</p>';
    }
}

async function deletarMagiaUI(magiaId) {
    if (confirm('Tem certeza que deseja deletar esta magia?')) {
        const resultado = await deletarMagia(magiaId);
        if (resultado.success) {
            carregarMagias();
        } else {
            alert('Erro ao deletar magia: ' + resultado.error);
        }
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
        container.innerHTML = resultado.data.map(hab => `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${hab.nome} (Nível ${hab.nivel})</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <p><strong>Dano:</strong> ${hab.dano}</p>
                    <p><strong>Efeito:</strong> ${hab.efeito || '-'}</p>
                    <p><strong>Mana:</strong> ${hab.custo_mana}</p>
                    <p><strong>Estamina:</strong> ${hab.custo_estamina || 0}</p>
                    <p><strong>Descrição:</strong> ${hab.descricao}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarHabilidade('${hab.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarHabilidadeUI('${hab.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhuma habilidade adicionada ainda.</p>';
    }
}

async function deletarHabilidadeUI(habilidadeId) {
    if (confirm('Tem certeza que deseja deletar esta habilidade?')) {
        const resultado = await deletarHabilidade(habilidadeId);
        if (resultado.success) {
            carregarHabilidades();
        } else {
            alert('Erro ao deletar habilidade: ' + resultado.error);
        }
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
        container.innerHTML = resultado.data.map(conhec => `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${conhec.nome} (Nível ${conhec.nivel})</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <p><strong>Descrição:</strong> ${conhec.descricao}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarConhecimento('${conhec.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarConhecimentoUI('${conhec.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Nenhum conhecimento adicionado ainda.</p>';
    }
}

async function deletarConhecimentoUI(conhecimentoId) {
    if (confirm('Tem certeza que deseja deletar este conhecimento?')) {
        const resultado = await deletarConhecimento(conhecimentoId);
        if (resultado.success) {
            carregarConhecimentos();
        } else {
            alert('Erro ao deletar conhecimento: ' + resultado.error);
        }
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
        container.innerHTML = resultado.data.map(item => `
            <div class="accordion-item" style="border: 1px solid #667eea; border-radius: 8px; margin-bottom: 10px; background: #1a2a4e;">
                <button class="accordion-header" onclick="toggleAccordion(this)" style="width: 100%; padding: 15px; background: #16213e; border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                    <span style="font-weight: bold;">${item.nome} (x${item.quantidade})</span>
                    <span style="font-size: 12px; color: #667eea; transition: transform 0.3s ease;">▼</span>
                </button>
                <div class="accordion-content" style="display: none; padding: 15px; background: #1a2a4e;">
                    <p><strong>Quantidade:</strong> ${item.quantidade}</p>
                    <p><strong>Peso:</strong> ${item.peso} kg</p>
                    <p><strong>Descrição:</strong> ${item.descricao}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="editarItem('${item.id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">✏️ Editar</button>
                        <button onclick="deletarItemUI('${item.id}')" style="background: #ff4444; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">🗑️ Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #b0b0b0;">Inventário vazio.</p>';
    }
}

async function deletarItemUI(itemId) {
    if (confirm('Tem certeza que deseja deletar este item?')) {
        const resultado = await deletarItem(itemId);
        if (resultado.success) {
            carregarItens();
        } else {
            alert('Erro ao deletar item: ' + resultado.error);
        }
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
    if (confirm('Tem certeza que deseja deletar esta anotação?')) {
        const resultado = await deletarAnotacao(anotacaoId);
        if (resultado.success) {
            carregarAnotacoes();
        } else {
            alert('Erro ao deletar anotação: ' + resultado.error);
        }
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

// ============================================
// MODAIS - ABRIR
// ============================================

function abrirModalMagia() {
    document.getElementById('modal-magia').style.display = 'flex';
}

function fecharModalMagia() {
    document.getElementById('modal-magia').style.display = 'none';
    document.getElementById('form-magia').reset();
    editandoMagiaId = null;
}

function abrirModalHabilidade() {
    document.getElementById('modal-habilidade').style.display = 'flex';
}

function fecharModalHabilidade() {
    document.getElementById('modal-habilidade').style.display = 'none';
    document.getElementById('form-habilidade').reset();
    editandoHabilidadeId = null;
}

function abrirModalConhecimento() {
    document.getElementById('modal-conhecimento').style.display = 'flex';
}

function fecharModalConhecimento() {
    document.getElementById('modal-conhecimento').style.display = 'none';
    document.getElementById('form-conhecimento').reset();
    editandoConhecimentoId = null;
}

function abrirModalItem() {
    document.getElementById('modal-item').style.display = 'flex';
}

function fecharModalItem() {
    document.getElementById('modal-item').style.display = 'none';
    document.getElementById('form-item').reset();
    editandoItemId = null;
}

function abrirModalAnotacao() {
    document.getElementById('modal-anotacao').style.display = 'flex';
}

function fecharModalAnotacao() {
    document.getElementById('modal-anotacao').style.display = 'none';
    document.getElementById('form-anotacao').reset();
    editandoAnotacaoId = null;
}

// ============================================
// SALVAR ITENS
// ============================================

async function salvarMagia() {
    console.log('salvarMagia chamado');
    console.log('editandoMagiaId:', editandoMagiaId);
    const nome = document.getElementById('magia-nome')?.value;
    const dano = document.getElementById('magia-dano')?.value;
    const efeito = document.getElementById('magia-efeito')?.value;
    const descricao = document.getElementById('magia-descricao')?.value;
    const custo_mana = document.getElementById('magia-custo-mana')?.value;
    const custo_estamina = document.getElementById('magia-custo-estamina')?.value;
    const nivelInput = document.getElementById('magia-nivel');
    const nivel = nivelInput ? nivelInput.value : 1;

    if (!nome || !dano) {
        alert('Preencha os campos obrigatórios!');
        return;
    }

    // Se está editando, atualiza ao invés de adicionar
    if (editandoMagiaId) {
        console.log('Editando magia ID:', editandoMagiaId);
        const resultado = await atualizarMagia(editandoMagiaId, {
            nome,
            dano,
            efeito,
            descricao,
            custo_mana: parseInt(custo_mana) || 0,
            custo_estamina: parseInt(custo_estamina) || 0,
            nivel: parseInt(nivel) || 1
        });

        if (resultado.success) {
            fecharModalMagia();
            carregarMagias();
            editandoMagiaId = null;
            alert('Magia atualizada com sucesso!');
        } else {
            alert('Erro ao atualizar magia: ' + resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        alert('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarMagia(fichaId, {
        nome,
        dano,
        efeito,
        descricao,
        custo_mana: parseInt(custo_mana) || 0,
        custo_estamina: parseInt(custo_estamina) || 0,
        nivel: parseInt(nivel) || 1
    });

    if (resultado.success) {
        fecharModalMagia();
        carregarMagias();
        alert('Magia adicionada com sucesso!');
    } else {
        alert('Erro ao adicionar magia: ' + resultado.error);
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
        alert('Preencha os campos obrigatórios!');
        return;
    }

    // Se está editando, atualiza ao invés de adicionar
    if (editandoHabilidadeId) {
        const resultado = await atualizarHabilidade(editandoHabilidadeId, {
            nome,
            dano,
            efeito,
            descricao,
            custo_mana: parseInt(custo_mana) || 0,
            custo_estamina: parseInt(custo_estamina) || 0,
            nivel: parseInt(nivel) || 1
        });

        if (resultado.success) {
            fecharModalHabilidade();
            carregarHabilidades();
            editandoHabilidadeId = null;
            alert('Habilidade atualizada com sucesso!');
        } else {
            alert('Erro ao atualizar habilidade: ' + resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        alert('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarHabilidade(fichaId, {
        nome,
        dano,
        efeito,
        descricao,
        custo_mana: parseInt(custo_mana) || 0,
        custo_estamina: parseInt(custo_estamina) || 0,
        nivel: parseInt(nivel) || 1
    });

    if (resultado.success) {
        fecharModalHabilidade();
        carregarHabilidades();
        alert('Habilidade adicionada com sucesso!');
    } else {
        alert('Erro ao adicionar habilidade: ' + resultado.error);
    }
}

async function salvarConhecimento() {
    const nome = document.getElementById('conhecimento-nome')?.value;
    const descricao = document.getElementById('conhecimento-descricao')?.value;
    const conhecNivelInput = document.getElementById('conhecimento-nivel');
    const nivel = conhecNivelInput ? conhecNivelInput.value : 1;

    if (!nome) {
        alert('Preencha o nome do conhecimento!');
        return;
    }

    // Se está editando, atualiza ao invés de adicionar
    if (editandoConhecimentoId) {
        const resultado = await atualizarConhecimento(editandoConhecimentoId, {
            nome,
            descricao,
            nivel: parseInt(nivel) || 1
        });

        if (resultado.success) {
            fecharModalConhecimento();
            carregarConhecimentos();
            editandoConhecimentoId = null;
            alert('Conhecimento atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar conhecimento: ' + resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        alert('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarConhecimento(fichaId, {
        nome,
        descricao,
        nivel: parseInt(nivel) || 1
    });

    if (resultado.success) {
        fecharModalConhecimento();
        carregarConhecimentos();
        alert('Conhecimento adicionado com sucesso!');
    } else {
        alert('Erro ao adicionar conhecimento: ' + resultado.error);
    }
}

async function salvarItem() {
    const nome = document.getElementById('item-nome')?.value;
    const quantidade = document.getElementById('item-quantidade')?.value;
    const descricao = document.getElementById('item-descricao')?.value;
    const peso = document.getElementById('item-peso')?.value;

    if (!nome || !quantidade) {
        alert('Preencha os campos obrigatórios!');
        return;
    }

    // Se está editando, atualiza ao invés de adicionar
    if (editandoItemId) {
        const resultado = await atualizarItem(editandoItemId, {
            nome,
            quantidade: parseInt(quantidade) || 1,
            descricao,
            peso: parseFloat(peso) || 0
        });

        if (resultado.success) {
            fecharModalItem();
            carregarItens();
            editandoItemId = null;
            alert('Item atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar item: ' + resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        alert('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarItem(fichaId, {
        nome,
        quantidade: parseInt(quantidade) || 1,
        descricao,
        peso: parseFloat(peso) || 0
    });

    if (resultado.success) {
        fecharModalItem();
        carregarItens();
        alert('Item adicionado com sucesso!');
    } else {
        alert('Erro ao adicionar item: ' + resultado.error);
    }
}

async function salvarAnotacao() {
    const titulo = document.getElementById('anotacao-titulo')?.value;
    const descricao = document.getElementById('anotacao-descricao')?.value;

    if (!titulo) {
        alert('Preencha o título da anotação!');
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
            alert('Anotação atualizada com sucesso!');
        } else {
            alert('Erro ao atualizar anotação: ' + resultado.error);
        }
        return;
    }

    const fichaId = obterFichaId() || window.fichaId || fichaIdGlobal;
    if (!fichaId) {
        alert('Erro: ID da ficha não encontrado!');
        return;
    }
    const resultado = await adicionarAnotacao(fichaId, {
        titulo,
        descricao
    });

    if (resultado.success) {
        fecharModalAnotacao();
        carregarAnotacoes();
        alert('Anotação adicionada com sucesso!');
    } else {
        alert('Erro ao adicionar anotação: ' + resultado.error);
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-magia') fecharModalMagia();
    if (e.target.id === 'modal-habilidade') fecharModalHabilidade();
    if (e.target.id === 'modal-conhecimento') fecharModalConhecimento();
    if (e.target.id === 'modal-item') fecharModalItem();
    if (e.target.id === 'modal-anotacao') fecharModalAnotacao();
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
    console.log('editarMagia chamado com ID:', magiaId);
    const resultado = await obterMagia(magiaId);
    if (!resultado.success) {
        alert('Erro ao carregar magia: ' + resultado.error);
        return;
    }
    const magia = resultado.data;
    editandoMagiaId = magiaId;
    console.log('editandoMagiaId definido como:', editandoMagiaId);
    document.getElementById('magia-nome').value = magia.nome;
    document.getElementById('magia-dano').value = magia.dano;
    document.getElementById('magia-efeito').value = magia.efeito || '';
    document.getElementById('magia-descricao').value = magia.descricao || '';
    document.getElementById('magia-custo-mana').value = magia.custo_mana || 0;
    document.getElementById('magia-custo-estamina').value = magia.custo_estamina || 0;
    const magiaInputNivel = document.getElementById('magia-nivel');
    if (magiaInputNivel) magiaInputNivel.value = magia.nivel || 1;
    
    abrirModalMagia();
}

async function editarHabilidade(habilidadeId) {
    const resultado = await obterHabilidade(habilidadeId);
    if (!resultado.success) {
        alert('Erro ao carregar habilidade: ' + resultado.error);
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
    
    abrirModalHabilidade();
}

async function editarConhecimento(conhecimentoId) {
    const resultado = await obterConhecimento(conhecimentoId);
    if (!resultado.success) {
        alert('Erro ao carregar conhecimento: ' + resultado.error);
        return;
    }
    const conhec = resultado.data;
    editandoConhecimentoId = conhecimentoId;
    document.getElementById('conhecimento-nome').value = conhec.nome;
    document.getElementById('conhecimento-descricao').value = conhec.descricao || '';
    const conhecInputNivel = document.getElementById('conhecimento-nivel');
    if (conhecInputNivel) conhecInputNivel.value = conhec.nivel || 1;
    
    abrirModalConhecimento();
}

async function editarItem(itemId) {
    const resultado = await obterItem(itemId);
    if (!resultado.success) {
        alert('Erro ao carregar item: ' + resultado.error);
        return;
    }
    const item = resultado.data;
    editandoItemId = itemId;
    document.getElementById('item-nome').value = item.nome;
    document.getElementById('item-quantidade').value = item.quantidade || 1;
    document.getElementById('item-descricao').value = item.descricao || '';
    document.getElementById('item-peso').value = item.peso || 0;
    
    abrirModalItem();
}

async function editarAnotacao(anotacaoId) {
    const resultado = await obterAnotacao(anotacaoId);
    if (!resultado.success) {
        alert('Erro ao carregar anotação: ' + resultado.error);
        return;
    }
    const anotacao = resultado.data;
    editandoAnotacaoId = anotacaoId;
    document.getElementById('anotacao-titulo').value = anotacao.titulo;
    document.getElementById('anotacao-descricao').value = anotacao.descricao || '';
    
    abrirModalAnotacao();
}