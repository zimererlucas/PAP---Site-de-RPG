// Variável global para armazenar o ID da ficha
let fichaId = null;
let fichaRealtimeChannel = null;
let fichaRealtimeTimer = null;
let fichaPollingInterval = null;
const HISTORICO_DADOS_MAX = 50;

// ============================================
// FUNÇÕES PARA ALTERAR VIDA, MANA E ESTAMINA (ESCOPO GLOBAL)
// ============================================

function alterarVida(valor) {
    const vidaAtualEl = document.getElementById('vidaAtual');
    const vidaMaximaEl = document.getElementById('vidaMaxima-view');

    if (!vidaAtualEl || !vidaMaximaEl) return;

    let vidaAtual = parseInt(vidaAtualEl.textContent) || 0;
    let vidaMaxima = parseInt(vidaMaximaEl.textContent) || 0;

    vidaAtual = Math.max(0, Math.min(vidaMaxima, vidaAtual + valor));

    vidaAtualEl.textContent = vidaAtual;
    atualizarBarraVida();
}

function alterarMana(valor) {
    const manaAtualEl = document.getElementById('manaAtual');
    const manaMaximaEl = document.getElementById('manaMaxima-view');

    if (!manaAtualEl || !manaMaximaEl) return;

    let manaAtual = parseInt(manaAtualEl.textContent) || 0;
    let manaMaxima = parseInt(manaMaximaEl.textContent) || 0;

    manaAtual = Math.max(0, Math.min(manaMaxima, manaAtual + valor));

    manaAtualEl.textContent = manaAtual;
    atualizarBarraMana();
}

function alterarEstamina(valor) {
    const estaminaAtualEl = document.getElementById('estaminaAtual');
    const estaminaMaximaEl = document.getElementById('estaminaMaxima-view');

    if (!estaminaAtualEl || !estaminaMaximaEl) return;

    let estaminaAtual = parseInt(estaminaAtualEl.textContent) || 0;
    let estaminaMaxima = parseInt(estaminaMaximaEl.textContent) || 0;

    estaminaAtual = Math.max(0, Math.min(estaminaMaxima, estaminaAtual + valor));

    estaminaAtualEl.textContent = estaminaAtual;
    atualizarBarraEstamina();
}

function atualizarBarraVida() {
    const vidaAtual = parseInt(document.getElementById('vidaAtual').textContent) || 0;
    const vidaMaxima = parseInt(document.getElementById('vidaMaxima-view').textContent) || 1;
    const percent = Math.round((vidaAtual / vidaMaxima) * 100);

    const vidaBar = document.getElementById('vidaBar');
    const vidaPercent = document.getElementById('vidaPercent');

    if (vidaBar) vidaBar.style.width = percent + '%';
    if (vidaPercent) vidaPercent.textContent = percent + '%';
}

function atualizarBarraMana() {
    const manaAtual = parseInt(document.getElementById('manaAtual').textContent) || 0;
    const manaMaxima = parseInt(document.getElementById('manaMaxima-view').textContent) || 1;
    const percent = Math.round((manaAtual / manaMaxima) * 100);

    const manaBar = document.getElementById('manaBar');
    const manaPercent = document.getElementById('manaPercent');

    if (manaBar) manaBar.style.width = percent + '%';
    if (manaPercent) manaPercent.textContent = percent + '%';
}

function atualizarBarraEstamina() {
    const estaminaAtual = parseInt(document.getElementById('estaminaAtual').textContent) || 0;
    const estaminaMaxima = parseInt(document.getElementById('estaminaMaxima-view').textContent) || 1;
    const percent = Math.round((estaminaAtual / estaminaMaxima) * 100);

    const estaminaBar = document.getElementById('estaminaBar');
    const estaminaPercent = document.getElementById('estaminaPercent');

    if (estaminaBar) estaminaBar.style.width = percent + '%';
    if (estaminaPercent) estaminaPercent.textContent = percent + '%';
}

// ============================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================
function switchTab(tabName) {
    // Esconder todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover estado ativo dos botões
    document.querySelectorAll('.ficha-navbar-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba selecionada
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) selectedTab.classList.add('active');

    // Ativar o botão que foi clicado (se o avento existir)
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    } else {
        // Fallback: procurar botão pelo texto ou data
        document.querySelectorAll('.ficha-navbar-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                btn.classList.add('active');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;

    // Obter ID da ficha da URL
    const params = new URLSearchParams(window.location.search);
    fichaId = params.get('id');
    window.fichaId = fichaId; // Tornar acessível globalmente

    if (!fichaId) {
        console.error('Ficha não encontrada!');
        window.location.href = 'fichas.html';
        return;
    }

    carregarHistoricoDados();

    // Carregar ficha
    await loadFicha();

    // Iniciar atualizações em tempo real
    iniciarRealtimeFicha();

    // Configurar upload de imagem
    setupImageUpload();
});

// ============================================
// ATUALIZAÇÃO EM TEMPO REAL DA FICHA
// ============================================

let camposEditandoAtivo = new Set();

function monitorarEdicaoCampos() {
    document.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            const id = e.target.id;
            if (id) camposEditandoAtivo.add(id);
        }
    }, true);

    document.addEventListener('blur', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            const id = e.target.id;
            if (id) {
                setTimeout(() => camposEditandoAtivo.delete(id), 500);
            }
        }
    }, true);
}

function iniciarRealtimeFicha() {
    if (!fichaId || !window.supabase) return;

    monitorarEdicaoCampos();

    if (fichaRealtimeChannel) {
        fichaRealtimeChannel.unsubscribe();
    }

    const handler = () => {
        if (fichaRealtimeTimer) clearTimeout(fichaRealtimeTimer);
        fichaRealtimeTimer = setTimeout(async () => {
            await loadFicha();
        }, 250);
    };

    fichaRealtimeChannel = supabase.channel(`ficha-realtime-${fichaId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'magias', filter: `personagem_id=eq.${fichaId}` }, handler)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'habilidades', filter: `personagem_id=eq.${fichaId}` }, handler)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario', filter: `personagem_id=eq.${fichaId}` }, handler)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'personagens', filter: `id=eq.${fichaId}` }, handler)
        .subscribe();
}

async function loadFicha() {
    try {
        const result = await getPersonagemById(fichaId);
        if (!result.success) return;

        const ficha = result.data;

        // Atualizar campos da UI com segurança
        const setElement = (id, value) => {
            const el = document.getElementById(id);
            if (el && !camposEditandoAtivo.has(id)) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                    el.value = value || '';
                } else {
                    el.textContent = value || '-';
                }
            }
        };

        // Informações Básicas
        setElement('nomePersonagem-view', ficha.nome);
        setElement('racaPersonagem-view', ficha.raca);
        setElement('nivelPersonagem-view', ficha.nivel);
        setElement('idadePersonagem-view', ficha.idade);
        setElement('header-raca', ficha.raca);
        
        const headerNome = document.getElementById('nomePersonagemHeader');
        if(headerNome) headerNome.textContent = ficha.nome || 'Ficha';

        // Imagem do Personagem
        const charImg = document.getElementById('charImage');
        if (charImg && ficha.imagem_url) {
            charImg.src = ficha.imagem_url;
        }

        // Status
        setElement('vidaAtual', ficha.vida_atual);
        setElement('vidaMaxima-view', ficha.vida_maxima);
        setElement('manaAtual', ficha.mana_atual);
        setElement('manaMaxima-view', ficha.mana_maxima);
        setElement('estaminaAtual', ficha.estamina_atual);
        setElement('estaminaMaxima-view', ficha.estamina_maxima);

        atualizarBarraVida();
        atualizarBarraMana();
        atualizarBarraEstamina();

        // Atributos
        const atributos = ['forca', 'agilidade', 'sorte', 'inteligencia', 'foco', 'arcanismo'];
        atributos.forEach(attr => {
            const base = ficha[attr + '_base'] || 0;
            const bonus = ficha[attr + '_bonus'] || 0;
            const total = base + bonus;
            
            setElement(attr + 'Base-view', base);
            setElement(attr + 'Bonus-view', bonus);
            setElement(attr + 'Total-view', total);
            
            // Povoar inputs de edição
            const input = document.getElementById(attr + 'Base');
            if (input && !camposEditandoAtivo.has(attr + 'Base')) {
                input.value = base;
            }
        });

        // Peso
        setElement('peso-view', ficha.peso);

    } catch (err) {
        console.error('Erro ao processar dados da ficha:', err);
    }
}

// ============================================
// EDIÇÃO DE INFORMAÇÕES BÁSICAS
// ============================================
function toggleEditarInfo() {
    const view = document.getElementById('info-view');
    const edit = document.getElementById('info-edit');
    if (view && edit) {
        if (view.style.display === 'none') {
            view.style.display = 'block';
            edit.style.display = 'none';
        } else {
            view.style.display = 'none';
            edit.style.display = 'block';
            
            // Povoar inputs
            document.getElementById('nomePersonagem').value = document.getElementById('nomePersonagem-view').textContent;
            document.getElementById('racaPersonagem').value = document.getElementById('racaPersonagem-view').textContent;
            document.getElementById('nivelPersonagem').value = document.getElementById('nivelPersonagem-view').textContent;
            document.getElementById('idadePersonagem').value = document.getElementById('idadePersonagem-view').textContent;
        }
    }
}

async function salvarInfo() {
    const nome = document.getElementById('nomePersonagem').value;
    const raca = document.getElementById('racaPersonagem').value;
    const nivel = document.getElementById('nivelPersonagem').value;
    const idade = document.getElementById('idadePersonagem').value;

    try {
        const { error } = await supabase
            .from('personagens')
            .update({
                nome: nome,
                raca: raca,
                nivel: parseInt(nivel) || 0,
                idade: parseInt(idade) || 0
            })
            .eq('id', fichaId);

        if (error) throw error;
        
        await loadFicha();
        toggleEditarInfo();
    } catch (err) {
        console.error('Erro ao salvar info:', err);
        alert('Erro ao salvar informações.');
    }
}

// ============================================
// EDIÇÃO DE ATRIBUTOS
// ============================================
function toggleEditarAtributos() {
    const viewCalcs = document.querySelectorAll('.atributo-calculo');
    const editCalcs = document.querySelectorAll('.atributo-calculo-edit');
    
    viewCalcs.forEach(el => {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });
    
    editCalcs.forEach(el => {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });

    const saveBtn = document.getElementById('atributos-save-btn');
    if (saveBtn) saveBtn.style.display = saveBtn.style.display === 'none' ? 'block' : 'none';
}

async function salvarAtributos() {
    const atributos = ['forca', 'agilidade', 'sorte', 'inteligencia', 'foco', 'arcanismo'];
    const updateData = {};

    atributos.forEach(attr => {
        const baseInput = document.getElementById(attr + 'Base');
        if (baseInput) {
            updateData[attr + '_base'] = parseInt(baseInput.value) || 0;
        }
    });

    try {
        const { error } = await supabase.from('personagens').update(updateData).eq('id', fichaId);
        if (error) throw error;
        await loadFicha();
        toggleEditarAtributos();
    } catch (err) {
        console.error('Erro ao salvar atributos:', err);
        alert('Erro ao salvar atributos.');
    }
}

function cancelarEditarAtributos() {
    toggleEditarAtributos();
}

// ============================================
// EDIÇÃO DE STATUS (VIDA, MANA, ESTAMINA)
// ============================================
function toggleEditarStatus() {
    const components = ['vida', 'mana', 'estamina'];
    
    components.forEach(comp => {
        const view = document.getElementById(comp + '-view');
        const edit = document.getElementById(comp + '-edit');
        if (view && edit) {
            if (view.style.display === 'none') {
                view.style.display = 'inline';
                edit.style.display = 'none';
            } else {
                view.style.display = 'none';
                edit.style.display = 'inline';
                
                // Povoar inputs
                const atualVal = document.getElementById(comp + 'Atual').textContent;
                const maximaVal = document.getElementById(comp + 'Maxima-view').textContent;
                
                const atualInput = document.getElementById(comp + 'Atual-edit');
                const maximaInput = document.getElementById(comp + 'Maxima');
                
                if (atualInput) atualInput.value = atualVal;
                if (maximaInput) maximaInput.value = maximaVal;
            }
        }
    });

    const saveBtn = document.getElementById('status-save-btn');
    if (saveBtn) saveBtn.style.display = saveBtn.style.display === 'none' ? 'block' : 'none';
}

async function salvarStatus() {
    const updateData = {
        vida_atual: parseInt(document.getElementById('vidaAtual-edit').value) || 0,
        vida_maxima: parseInt(document.getElementById('vidaMaxima').value) || 1,
        mana_atual: parseInt(document.getElementById('manaAtual-edit').value) || 0,
        mana_maxima: parseInt(document.getElementById('manaMaxima').value) || 1,
        estamina_atual: parseInt(document.getElementById('estaminaAtual-edit').value) || 0,
        estamina_maxima: parseInt(document.getElementById('estaminaMaxima').value) || 1
    };

    try {
        const { error } = await supabase.from('personagens').update(updateData).eq('id', fichaId);
        if (error) throw error;
        await loadFicha();
        toggleEditarStatus();
    } catch (err) {
        console.error('Erro ao salvar status:', err);
        alert('Erro ao salvar status.');
    }
}

function cancelarEditarStatus() {
    toggleEditarStatus();
}

// ============================================
// UPLOAD DE IMAGEM DO PERSONAGEM
// ============================================
let cropper = null;

function setupImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'charImageInput';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', handleImageSelect);
}

function triggerImageUpload() {
    document.getElementById('charImageInput').click();
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const modal = document.getElementById('cropperModal');
        const img = document.getElementById('imageToCrop');
        img.src = e.target.result;
        modal.style.display = 'flex';

        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: 3 / 4,
            viewMode: 1
        });
    };
    reader.readAsDataURL(file);
}

async function saveCrop() {
    if (!cropper) return;

    const loading = document.getElementById('cropperLoading');
    loading.style.display = 'flex';

    const canvas = cropper.getCroppedCanvas({ width: 600, height: 800 });
    canvas.toBlob(async (blob) => {
        try {
            const fileName = `${fichaId}_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('personagens')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('personagens').getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('personagens')
                .update({ imagem_url: publicUrl })
                .eq('id', fichaId);

            if (updateError) throw updateError;

            document.getElementById('charImage').src = publicUrl;
            fecharModalCropper();
        } catch (err) {
            console.error('Erro no upload:', err);
            alert('Erro ao salvar imagem.');
        } finally {
            loading.style.display = 'none';
        }
    }, 'image/jpeg');
}

function fecharModalCropper() {
    document.getElementById('cropperModal').style.display = 'none';
    if (cropper) cropper.destroy();
    cropper = null;
    document.getElementById('charImageInput').value = '';
}

function cancelCrop() {
    fecharModalCropper();
}

// ============================================
// HISTÓRICO DE ROLAGENS
// ============================================
document.addEventListener('diceRolled', (event) => {
    const { tipo, nome, dados, resultado } = event.detail || {};
    if (!resultado) return;

    registrarHistoricoDado({
        timestamp: Date.now(),
        tipo: tipo || '-',
        nome: nome || '-',
        total: resultado.total,
        detalhes: resultado.resultado_formatado,
        dados: dados || []
    });
});

function getHistoricoKey() {
    return fichaId ? `dice-history-${fichaId}` : null;
}

function carregarHistoricoDados() {
    const tbody = document.getElementById('diceHistoryBody');
    if (!tbody) return;

    const key = getHistoricoKey();
    if (!key) return;

    try {
        const historico = JSON.parse(localStorage.getItem(key) || '[]');
        renderHistoricoDados(historico);
    } catch (err) {
        console.error('Erro ao carregar histórico:', err);
    }
}

function registrarHistoricoDado(entry) {
    const key = getHistoricoKey();
    if (!key) return;

    let historico = JSON.parse(localStorage.getItem(key) || '[]');
    historico.unshift(entry);
    if (historico.length > HISTORICO_DADOS_MAX) historico.length = HISTORICO_DADOS_MAX;

    localStorage.setItem(key, JSON.stringify(historico));
    renderHistoricoDados(historico);
}

function renderHistoricoDados(historico) {
    const tbody = document.getElementById('diceHistoryBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!historico || historico.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Sem rolagens recentes</td></tr>';
        return;
    }

    historico.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(item.timestamp).toLocaleTimeString()}</td>
            <td>${item.nome}</td>
            <td>${item.total}</td>
            <td style="font-size: 0.85em; opacity: 0.8">${item.detalhes}</td>
        `;
        tbody.appendChild(row);
    });
}
