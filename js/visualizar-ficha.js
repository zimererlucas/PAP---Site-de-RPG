// Variável global para armazenar o ID da ficha
let fichaId = null;
let fichaRealtimeChannel = null;
let fichaRealtimeTimer = null;
let fichaPollingInterval = null;
const HISTORICO_DADOS_MAX = 50;

// ============================================
// FUNÇÕES PARA ALTERAR VIDA, MANA E ESTAMINA (ESCOPO GLOBAL)
// ============================================

let debounceTimerStatus = null;

async function debounceSalvarStatusRapido() {
    if (!fichaId || !window.supabase) return;

    if (debounceTimerStatus) clearTimeout(debounceTimerStatus);
    debounceTimerStatus = setTimeout(async () => {
        const vidaAtualEl = document.getElementById('vidaAtual');
        const manaAtualEl = document.getElementById('manaAtual');
        const estaminaAtualEl = document.getElementById('estaminaAtual');

        if (!vidaAtualEl || !manaAtualEl || !estaminaAtualEl) return;

        const vidaAtual = parseInt(vidaAtualEl.textContent) || 0;
        const manaAtual = parseInt(manaAtualEl.textContent) || 0;
        const estaminaAtual = parseInt(estaminaAtualEl.textContent) || 0;

        try {
            const { error } = await supabase.from('personagens').update({
                vida_atual: vidaAtual,
                mana_atual: manaAtual,
                estamina_atual: estaminaAtual
            }).eq('id', fichaId);

            if (error) throw error;
        } catch (err) {
            console.error('Erro ao auto-salvar status:', err);
        }
    }, 500);
}

function alterarVida(valor) {
    const vidaAtualEl = document.getElementById('vidaAtual');
    const vidaMaximaEl = document.getElementById('vidaMaxima-view');

    if (!vidaAtualEl || !vidaMaximaEl) return;

    let vidaAtual = parseInt(vidaAtualEl.textContent) || 0;
    let vidaMaxima = parseInt(vidaMaximaEl.textContent) || 0;

    vidaAtual = Math.max(0, Math.min(vidaMaxima, vidaAtual + valor));

    vidaAtualEl.textContent = vidaAtual;
    atualizarBarraVida();
    debounceSalvarStatusRapido();
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
    debounceSalvarStatusRapido();
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
    debounceSalvarStatusRapido();
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

    if (params.get('view') === 'true') {
        aplicarModoLeitura();
    }

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
// MODO VISUALIZAÇÃO (READ-ONLY)
// ============================================
function aplicarModoLeitura() {
    // Adiciona classe ao body para esconder via CSS
    document.body.classList.add('view-only-mode');

    // Injeta estilo global para forçar read-only
    const style = document.createElement('style');
    style.innerHTML = `
        .view-only-mode button[onclick*="toggleEditar"],
        .view-only-mode button[onclick*="editar"],
        .view-only-mode button[onclick*="Editar"],
        .view-only-mode button[onclick*="alternarAtivacao"],
        .view-only-mode button[onclick*="rolarDadosUI"],
        .view-only-mode button[onclick*="abrirModal"],
        .view-only-mode .edit-overlay,
        .view-only-mode button.btn-danger,
        .view-only-mode button.btn-warning,
        .view-only-mode button[onclick*="excluir"],
        .view-only-mode button[onclick*="deletar"],
        .view-only-mode button[onclick*="remover"],
        .view-only-mode button[onclick*="alterarVida"],
        .view-only-mode button[onclick*="alterarMana"],
        .view-only-mode button[onclick*="alterarEstamina"],
        .view-only-mode .ponto-hint,
        .view-only-mode #info-save-btn,
        .view-only-mode #atributos-save-btn,
        .view-only-mode #status-save-btn {
            display: none !important;
        }
        .view-only-mode .ponto-celula {
            cursor: default !important;
            pointer-events: none !important;
            background: rgba(102, 126, 234, 0.08) !important;
            border-color: rgba(102, 126, 234, 0.25) !important;
            transform: none !important;
        }
        .view-only-mode .stat-pill[onclick] {
            cursor: default !important;
            pointer-events: none !important;
        }
        .view-only-mode input[type="file"] {
            display: none !important;
        }
        /* Oculta os botões "Ações" das tabelas e listas dinâmicas se houver classes gerais */
        .view-only-mode .acao-container,
        .view-only-mode .actions-cell {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // Evitar edições em campos de texto caso existam visíveis
    setTimeout(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(el => el.disabled = true);

        // Específico para as tabelas dentro da ficha-items, caso tenham botões que ficaram:
        const botoesRemover = document.querySelectorAll('button');
        botoesRemover.forEach(btn => {
            if (btn.textContent.includes('Remover') || btn.textContent.includes('Deletar') || btn.textContent.includes('Excluir') || btn.innerHTML.includes('🗑️')) {
                btn.style.display = 'none';
            }
        });
    }, 1000);
}

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

function mostrarErroFicha(mensagem) {
    const container = document.querySelector('.ficha-container');
    if (!container) return;
    // Evitar duplicar a mensagem
    if (document.getElementById('ficha-erro-msg')) return;
    const erroDiv = document.createElement('div');
    erroDiv.id = 'ficha-erro-msg';
    erroDiv.style.cssText = `
        background: rgba(255, 68, 68, 0.15);
        border: 1px solid rgba(255, 68, 68, 0.5);
        border-radius: 10px;
        padding: 20px 25px;
        margin: 20px 0;
        color: #ff8080;
        font-size: 1em;
        text-align: center;
    `;
    erroDiv.innerHTML = `
        <div style="font-size: 1.8em; margin-bottom: 10px;">⚠️</div>
        <strong>Erro ao carregar a ficha</strong>
        <p style="margin: 8px 0 0 0; font-size: 0.9em; opacity: 0.85;">${mensagem}</p>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">🔄 Tentar novamente</button>
    `;
    container.prepend(erroDiv);
}

async function loadFicha() {
    try {
        // Timeout de 15 segundos para evitar loading infinito em rede lenta
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite esgotado. Verifica a tua ligação à internet.')), 15000)
        );
        const result = await Promise.race([getPersonagemById(fichaId), timeoutPromise]);
        if (!result.success) {
            mostrarErroFicha('Não foi possível obter os dados da ficha. ' + (result.error || ''));
            return;
        }

        const ficha = result.data;
        window.dadosFicha = ficha; // Salva para uso na edição

        // Atualizar campos da UI com segurança
        const setElement = (id, value) => {
            const el = document.getElementById(id);
            if (el && !camposEditandoAtivo.has(id)) {
                // Usar null/undefined check explícito para não tratar 0 como falsy
                const displayValue = (value !== null && value !== undefined) ? value : '';
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                    el.value = displayValue;
                } else {
                    el.textContent = displayValue !== '' ? displayValue : '-';
                }
            }
        };

        // Informações Básicas
        setElement('nome-view', ficha.nome);
        setElement('raca-view', ficha.raca);
        setElement('nivel-view', ficha.nivel);
        setElement('idade-view', ficha.idade);

        setElement('altura-view', ficha.altura);
        setElement('peso-view', ficha.peso);
        setElement('header-raca', ficha.raca);

        const headerNome = document.getElementById('nomePersonagemHeader');
        if (headerNome) headerNome.textContent = ficha.nome || 'Ficha';

        // Imagem do Personagem
        const fotoImg = document.getElementById('fotoPersonagem');
        // Usa `foto_url` ou `foto` consoante qual estiver popular do banco de dados (foto_url foi o que encontrámos por inspeção, foto é legado)
        const URLImagem = ficha.foto_url || ficha.foto;
        if (fotoImg && URLImagem) {
            fotoImg.src = URLImagem;
        }

        // Status — somar base + bónus para os máximos
        const vidaMaximaTotal = (ficha.vida_maxima || 0) + (ficha.vida_maxima_bonus || 0);
        const manaMaximaTotal = (ficha.mana_maxima || 0) + (ficha.mana_maxima_bonus || 0);
        const estaminaMaximaTotal = (ficha.estamina_maxima || 0) + (ficha.estamina_maxima_bonus || 0);

        setElement('vidaAtual', ficha.vida_atual);
        setElement('vidaMaxima-view', vidaMaximaTotal);
        setElement('manaAtual', ficha.mana_atual);
        setElement('manaMaxima-view', manaMaximaTotal);
        setElement('estaminaAtual', ficha.estamina_atual);
        setElement('estaminaMaxima-view', estaminaMaximaTotal);

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
            // IDs dos totais no HTML não têm sufixo -view (ex: "forcaTotal")
            const totalEl = document.getElementById(attr + 'Total');
            if (totalEl && !camposEditandoAtivo.has(attr + 'Total')) {
                totalEl.textContent = total;
            }
            // Atualizar também o total no modo edição
            const totalEditEl = document.getElementById(attr + 'Total-edit');
            if (totalEditEl) totalEditEl.textContent = total;

            // Povoar inputs de edição
            const input = document.getElementById(attr + 'Base');
            if (input && !camposEditandoAtivo.has(attr + 'Base')) {
                input.value = base;
            }
        });

        // Calcular Esquiva e Acerto a partir de Agilidade (regra: +1 acerto e +1 esquiva por ponto)
        const agilidadeBase = ficha['agilidade_base'] || 0;
        const agilidadeBonus = ficha['agilidade_bonus'] || 0;
        const agilidadeTotal = agilidadeBase + agilidadeBonus;
        const esquivaEl = document.getElementById('esquivaValor');
        const acertoEl = document.getElementById('acertoValor');
        if (esquivaEl) esquivaEl.textContent = agilidadeTotal;
        if (acertoEl) acertoEl.textContent = agilidadeTotal;

        // Peso
        setElement('peso-view', ficha.peso);

        // Pontos especiais
        setElement('ponto-bloqueio-view', ficha.ponto_bloqueio !== undefined ? ficha.ponto_bloqueio : 0);
        setElement('ponto-reacao-view', ficha.ponto_reacao !== undefined ? ficha.ponto_reacao : 0);
        setElement('ponto-destino-view', ficha.ponto_destino !== undefined ? ficha.ponto_destino : 0);
        setElement('ponto-treinamento-view', ficha.ponto_treinamento !== undefined ? ficha.ponto_treinamento : 0);
        setElement('ponto-estabilidade-view', ficha.ponto_estabilidade !== undefined ? ficha.ponto_estabilidade : 0);
        setElement('ponto-estrategia-view', ficha.ponto_estrategia !== undefined ? ficha.ponto_estrategia : 0);

        // Atualizar Espaços de Habilidade
        if (typeof calcularEspacosHabilidade === 'function') {
            await calcularEspacosHabilidade(fichaId);
        }

    } catch (err) {
        console.error('Erro ao processar dados da ficha:', err);
        mostrarErroFicha(err.message || 'Ocorreu um erro inesperado. Tenta recarregar a página.');
    }
}

// ============================================
// EDIÇÃO DE INFORMAÇÕES BÁSICAS
// ============================================
function toggleEditarInfo() {
    const fields = ['nome', 'raca', 'idade', 'nivel', 'altura', 'peso'];
    const saveBtn = document.getElementById('info-save-btn');

    const isEditing = saveBtn && saveBtn.style.display !== 'none';

    if (isEditing) {
        fields.forEach(f => {
            const view = document.getElementById(f === 'raca' ? 'raca-container' : f + '-view');
            const input = document.getElementById(f);
            if (view) view.style.display = 'block';
            if (input) input.style.display = 'none';
        });
        if (saveBtn) saveBtn.style.display = 'none';

        const nomeView = document.getElementById('nome-view');
        if (nomeView) nomeView.style.display = '';
        const racaView = document.getElementById('raca-container');
        if (racaView) racaView.style.display = '';
        const idadeView = document.getElementById('idade-view');
        if (idadeView) idadeView.style.display = '';
        const nivelView = document.getElementById('nivel-view');
        if (nivelView) nivelView.style.display = '';
        const alturaView = document.getElementById('altura-view');
        if (alturaView) alturaView.style.display = '';
        const pesoView = document.getElementById('peso-view');
        if (pesoView) pesoView.style.display = '';

    } else {
        const fichaDados = window.dadosFicha || {};
        fields.forEach(f => {
            const view = document.getElementById(f === 'raca' ? 'raca-container' : f + '-view');
            const input = document.getElementById(f);
            if (view && input) {
                view.style.display = 'none';
                input.style.display = 'block';
                input.value = fichaDados[f] !== undefined && fichaDados[f] !== null ? fichaDados[f] : '';
            }
        });
        if (saveBtn) saveBtn.style.display = 'block';
    }
}

function cancelarEditarInfo() {
    toggleEditarInfo();
}

// ============================================
// EDIÇÃO INLINE DE PONTOS (clique direto na célula)
// ============================================
function ativarEdicaoPonto(viewId, dbKey, celulaEl) {
    // Evitar dupla activação se já estiver a editar
    if (celulaEl.classList.contains('editando')) return;

    const viewEl = document.getElementById(viewId + '-view');
    if (!viewEl) return;

    const valorAtual = parseInt(viewEl.textContent) || 0;

    // Criar input inline
    const input = document.createElement('input');
    input.type = 'number';
    input.value = valorAtual;
    input.min = '0';
    input.className = 'ponto-input-inline';

    // Substituir o elemento de valor pelo input
    viewEl.style.display = 'none';
    viewEl.parentNode.insertBefore(input, viewEl.nextSibling);

    celulaEl.classList.add('editando');
    // Remover o onclick enquanto edita para não re-activar
    celulaEl.onclick = null;

    input.focus();
    input.select();

    const finalizarEdicao = async () => {
        const novoValor = parseInt(input.value) || 0;
        input.remove();
        viewEl.style.display = '';
        viewEl.textContent = novoValor;
        celulaEl.classList.remove('editando');
        // Restaurar onclick
        celulaEl.onclick = () => ativarEdicaoPonto(viewId, dbKey, celulaEl);

        // Actualizar o cache local
        if (window.dadosFicha) window.dadosFicha[dbKey] = novoValor;

        // Guardar no Supabase
        try {
            const { error } = await supabase
                .from('personagens')
                .update({ [dbKey]: novoValor })
                .eq('id', fichaId);
            if (error) throw error;
        } catch (err) {
            console.error('Erro ao guardar ponto:', err);
            alert('Erro ao guardar ponto.');
        }
    };

    input.addEventListener('blur', finalizarEdicao);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
            // Cancelar sem guardar
            input.removeEventListener('blur', finalizarEdicao);
            input.remove();
            viewEl.style.display = '';
            celulaEl.classList.remove('editando');
            celulaEl.onclick = () => ativarEdicaoPonto(viewId, dbKey, celulaEl);
        }
    });
}

async function salvarInfo() {
    const nome = document.getElementById('nome').value;
    const raca = document.getElementById('raca').value;
    const nivel = document.getElementById('nivel').value;
    const idade = document.getElementById('idade').value;
    const altura = document.getElementById('altura') ? document.getElementById('altura').value : null;
    const peso = document.getElementById('peso') ? document.getElementById('peso').value : null;

    try {
        const updateData = {
            nome: nome,
            raca: raca,
            nivel: parseInt(nivel) || 0,
            idade: parseInt(idade) || 0
        };
        if (altura !== null) updateData.altura = altura;
        if (peso !== null) updateData.peso = peso;

        const { error } = await supabase
            .from('personagens')
            .update(updateData)
            .eq('id', fichaId);

        if (error) throw error;

        await loadFicha();
        const saveBtn = document.getElementById('info-save-btn');
        if (saveBtn && saveBtn.style.display !== 'none') {
            toggleEditarInfo();
        }
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

    const isOpening = viewCalcs.length > 0 && viewCalcs[0].style.display !== 'none';

    viewCalcs.forEach(el => {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });

    editCalcs.forEach(el => {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });

    const saveBtn = document.getElementById('atributos-save-btn');
    if (saveBtn) saveBtn.style.display = saveBtn.style.display === 'none' ? 'block' : 'none';

    // Ao abrir o modo de edição, adicionar listeners de input para atualizar totais em tempo real
    if (isOpening) {
        const atributos = ['forca', 'agilidade', 'sorte', 'inteligencia', 'foco', 'arcanismo'];
        atributos.forEach(attr => {
            const baseInput = document.getElementById(attr + 'Base');
            const bonusInput = document.getElementById(attr + 'Bonus');
            const totalSpan = document.getElementById(attr + 'Total-edit');
            if (baseInput && totalSpan) {
                baseInput.oninput = () => {
                    const base = parseInt(baseInput.value) || 0;
                    const bonus = bonusInput ? (parseInt(bonusInput.value) || 0) : 0;
                    totalSpan.textContent = base + bonus;
                };
            }
        });
    }
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

                // Povoar inputs — usar valor base da BD (sem bónus) para o máximo
                const atualVal = document.getElementById(comp + 'Atual').textContent;
                const dadosFicha = window.dadosFicha || {};
                const baseKey = comp === 'estamina' ? 'estamina_maxima' : comp + '_maxima';
                const baseMaxima = dadosFicha[baseKey] !== undefined ? dadosFicha[baseKey] :
                    parseInt(document.getElementById(comp + 'Maxima-view').textContent) || 0;

                const atualInput = document.getElementById(comp + 'Atual-edit');
                const maximaInput = document.getElementById(comp + 'Maxima');

                if (atualInput) atualInput.value = atualVal;
                if (maximaInput) maximaInput.value = baseMaxima;
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
    const input = document.getElementById('fotoInput');
    if (input) {
        input.addEventListener('change', handleImageSelect);
    }
}

function triggerImageUpload() {
    const input = document.getElementById('fotoInput');
    if (input) input.click();
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
                .update({ foto_url: publicUrl })
                .eq('id', fichaId);

            if (updateError) throw updateError;

            document.getElementById('fotoPersonagem').src = publicUrl;
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
    const input = document.getElementById('fotoInput');
    if (input) input.value = '';
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

// ============================================
// EDIÇÃO DE BÔNUS DE ESPAÇOS DE HABILIDADE
// ============================================

function toggleEditarEspacos() {
    const viewContainer = document.getElementById('espacos-total-view-container');
    const editContainer = document.getElementById('espacos-total-edit-container');
    const saveBtn = document.getElementById('espacos-save-btn');
    const input = document.getElementById('espacos-total-input');

    if (!viewContainer || !editContainer || !saveBtn || !input) return;

    const isEditing = saveBtn.style.display !== 'none';

    if (isEditing) {
        viewContainer.style.display = 'inline-flex';
        editContainer.style.display = 'none';
        saveBtn.style.display = 'none';
    } else {
        viewContainer.style.display = 'none';
        editContainer.style.display = 'inline-flex';
        saveBtn.style.display = 'block';
        
        // Preencher com o bônus atual
        const bonusSalvo = window.dadosFicha ? (window.dadosFicha.espacos_bonus || 0) : 0;
        input.value = bonusSalvo;

        // Calcular e mostrar o máximo atual (5 + nível + bônus)
        const nivelAtual = parseInt(window.dadosFicha?.nivel) || 0;
        const maxAtual = 5 + nivelAtual + bonusSalvo;
        const labelMaxAtual = document.getElementById('espacos-max-atual-label');
        if (labelMaxAtual) labelMaxAtual.textContent = maxAtual;

        // Inicializar preview com o valor atual
        atualizarPreviewEspacos();

        input.focus();
    }
}

function atualizarPreviewEspacos() {
    const input = document.getElementById('espacos-total-input');
    const previewValor = document.getElementById('espacos-preview-valor');
    if (!input || !previewValor) return;

    const novoBonus = parseInt(input.value) || 0;
    const nivelAtual = parseInt(window.dadosFicha?.nivel) || 0;
    const novoMax = 5 + nivelAtual + novoBonus;
    previewValor.textContent = novoMax;
}

async function salvarEspacosBonus() {
    if (!fichaId || !window.supabase) return;
    
    const input = document.getElementById('espacos-total-input');
    if (!input) return;

    const novoBonus = parseInt(input.value) || 0;

    try {
        const { error } = await supabase
            .from('personagens')
            .update({ espacos_bonus: novoBonus })
            .eq('id', fichaId);

        if (error) throw error;

        // Atualizar nos dados instanciados e recalcular 
        if (window.dadosFicha) {
            window.dadosFicha.espacos_bonus = novoBonus;
        }

        if (typeof calcularEspacosHabilidade === 'function') {
            await calcularEspacosHabilidade(fichaId);
        }

        toggleEditarEspacos();
    } catch (err) {
        console.error('Erro ao salvar bônus de espaços:', err);
        alert('Ocorreu um erro ao salvar (já executou o script SQL? Verifique a coluna espacos_bonus)');
    }
}
