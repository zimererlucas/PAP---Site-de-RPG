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

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;

    // Obter ID da ficha da URL
    const params = new URLSearchParams(window.location.search);
    fichaId = params.get('id');
    window.fichaId = fichaId; // Tornar acessível globalmente

    console.log('fichaId definido:', window.fichaId);

    if (!fichaId) {
        console.error('Ficha não encontrada!');
        window.location.href = 'fichas.html';
        return;
    }

    carregarHistoricoDados();

    // Identificar campanha do personagem para broadcast de dados
    try {
        const { data: participacoes } = await supabase
            .from('campanha_personagens')
            .select('campanha_id')
            .eq('personagem_id', fichaId)
            .limit(1);

        if (participacoes && participacoes.length > 0) {
            window.currentCampanhaId = participacoes[0].campanha_id;
            console.log('📡 Conectado à campanha:', window.currentCampanhaId);
        }
    } catch (err) {
        console.warn('Erro ao verificar campanha do personagem:', err);
    }

    // Atualizar navbar
    atualizarNavbar();

    // Carregar ficha
    await loadFicha();

    // Iniciar atualizações em tempo real
    iniciarRealtimeFicha();
});

// Ouvir eventos de storage para updates disparados pela tela de campanha
window.addEventListener('storage', (event) => {
    if (event.key === 'turno-passado' && event.newValue) {
        // Recarrega ficha quando um turno é passado na campanha
        loadFicha();
    }
    if (event.key && event.key.startsWith('dice-history')) {
        const key = getHistoricoKey();
        if (key && event.key === key) {
            carregarHistoricoDados();
        }
    }
});

function irParaLogin() {
    window.location.href = 'index.html';
}

function fazerLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    window.location.href = 'index.html';
}

// ============================================
// ATUALIZAÇÃO EM TEMPO REAL DA FICHA
// ============================================

// Rastrear campos sendo editados
let camposEditandoAtivo = new Set();

// Adicionar listeners para detectar quando um campo está sendo editado
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
                // Remover após um pequeno delay para permitir salvar
                setTimeout(() => camposEditandoAtivo.delete(id), 500);
            }
        }
    }, true);
}

function iniciarRealtimeFicha() {
    if (!fichaId || !window.supabase) return;

    // Monitorar campos sendo editados
    monitorarEdicaoCampos();

    // Evitar múltiplas inscrições
    if (fichaRealtimeChannel) {
        fichaRealtimeChannel.unsubscribe();
    }
    if (fichaPollingInterval) {
        clearInterval(fichaPollingInterval);
        fichaPollingInterval = null;
    }

    const handler = () => {
        // Debounce para evitar chamadas múltiplas seguidas
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
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('🔔 Realtime da ficha habilitado');
            }
        });

    // Remover polling automático - só atualiza quando há mudanças reais
    // fichaPollingInterval = setInterval(() => {
    //     loadFicha();
    // }, 2000);
}

// Limpar inscrição ao sair
window.addEventListener('beforeunload', () => {
    if (fichaRealtimeChannel) {
        fichaRealtimeChannel.unsubscribe();
    }
    if (fichaPollingInterval) {
        clearInterval(fichaPollingInterval);
    }
});

function atualizarNavbar() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

async function loadFicha() {
    const loadingState = document.getElementById('loadingState');
    const fichaContent = document.getElementById('fichaContent');

    try {
        const result = await getPersonagemById(fichaId);

        if (!result.success) {
            console.error('Erro ao carregar ficha:', result.error);
            if (loadingState) loadingState.style.display = 'none';
            return;
        }

        const ficha = result.data;

        // Função auxiliar para setar textContent com segurança
        const setElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value || '-';
        };

        // Função auxiliar para setar valor de input APENAS se não estiver sendo editado
        const setInputSafe = (id, value) => {
            if (camposEditandoAtivo.has(id)) return; // Skip se está sendo editado
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        // Header
        setElement('nomePersonagemHeader', ficha.nome || 'Ficha de Personagem');
        setElement('racaPersonagemHeader', ficha.raca || '-');

        // Informações pessoais (view e input)
        setElement('nome-view', ficha.nome || '-');
        setElement('raca-view', ficha.raca || '-');
        setElement('idade-view', ficha.idade || '-');
        setElement('nivel-view', ficha.nivel || 0);
        setElement('altura-view', ficha.altura || '-');
        setElement('peso-view', ficha.peso || '-');

        setInputSafe('nome', ficha.nome);
        setInputSafe('raca', ficha.raca);
        setInputSafe('idade', ficha.idade);
        setInputSafe('nivel', ficha.nivel || 0);
        setInputSafe('altura', ficha.altura);
        setInputSafe('peso', ficha.peso);

        // Atributos - Força
        const forcaBaseVal = ficha.forca_base || 0;
        const forcaBonusVal = ficha.forca_bonus || 0;
        const forcaTotalVal = forcaBaseVal + forcaBonusVal;
        setElement('forcaBase-view', forcaBaseVal);
        setElement('forcaBonus-view', forcaBonusVal);
        setElement('forcaTotal', forcaTotalVal);
        setInputSafe('forcaBase', forcaBaseVal);
        setInputSafe('forcaBonus', forcaBonusVal);

        // Atributos - Agilidade
        const agilidadeBaseVal = ficha.agilidade_base || 0;
        const agilidadeBonusVal = ficha.agilidade_bonus || 0;
        const agilidadeTotalVal = agilidadeBaseVal + agilidadeBonusVal;
        setElement('agilidadeBase-view', agilidadeBaseVal);
        setElement('agilidadeBonus-view', agilidadeBonusVal);
        setElement('agilidadeTotal', agilidadeTotalVal);
        setInputSafe('agilidadeBase', agilidadeBaseVal);
        setInputSafe('agilidadeBonus', agilidadeBonusVal);

        // Atributos - Sorte
        const sorteBaseVal = ficha.sorte_base || 0;
        const sorteBonusVal = ficha.sorte_bonus || 0;
        const sorteTotalVal = sorteBaseVal + sorteBonusVal;
        setElement('sorteBase-view', sorteBaseVal);
        setElement('sorteBonus-view', sorteBonusVal);
        setElement('sorteTotal', sorteTotalVal);
        setInputSafe('sorteBase', sorteBaseVal);
        setInputSafe('sorteBonus', sorteBonusVal);

        // Atributos - Inteligência
        const inteligenciaBaseVal = ficha.inteligencia_base || 0;
        const inteligenciaBonusVal = ficha.inteligencia_bonus || 0;
        const inteligenciaTotalVal = inteligenciaBaseVal + inteligenciaBonusVal;
        setElement('inteligenciaBase-view', inteligenciaBaseVal);
        setElement('inteligenciaBonus-view', inteligenciaBonusVal);
        setElement('inteligenciaTotal', inteligenciaTotalVal);
        setInputSafe('inteligenciaBase', inteligenciaBaseVal);
        setInputSafe('inteligenciaBonus', inteligenciaBonusVal);

        // Atributos - Foco
        const focoBaseVal = ficha.foco_base || 0;
        const focoBonusVal = ficha.foco_bonus || 0;
        const focoTotalVal = focoBaseVal + focoBonusVal;
        setElement('focoBase-view', focoBaseVal);
        setElement('focoBonus-view', focoBonusVal);
        setElement('focoTotal', focoTotalVal);
        setInputSafe('focoBase', focoBaseVal);
        setInputSafe('focoBonus', focoBonusVal);

        // Atributos - Arcanismo
        const arcanismoBaseVal = ficha.arcanismo_base || 0;
        const arcanismoBonusVal = ficha.arcanismo_bonus || 0;
        const arcanismoTotalVal = arcanismoBaseVal + arcanismoBonusVal;
        setElement('arcanismoBase-view', arcanismoBaseVal);
        setElement('arcanismoBonus-view', arcanismoBonusVal);
        setElement('arcanismoTotal', arcanismoTotalVal);
        setInputSafe('arcanismoBase', arcanismoBaseVal);
        setInputSafe('arcanismoBonus', arcanismoBonusVal);
        const arcanismoBaseInput = document.getElementById('arcanismoBase');
        const arcanismoBonusInput = document.getElementById('arcanismoBonus');
        if (arcanismoBaseInput) arcanismoBaseInput.value = arcanismoBaseVal;
        if (arcanismoBonusInput) arcanismoBonusInput.value = arcanismoBonusVal;

        // Calcular Esquiva e Acerto (1 de agilidade = 1 de acerto e esquiva)
        const esquivaBase = agilidadeTotalVal;
        const esquivaBonus = ficha.esquiva_bonus || 0;
        const esquivaTotal = esquivaBase + esquivaBonus;
        setElement('esquivaValor', esquivaTotal);

        const acertoBase = agilidadeTotalVal;
        const acertoBonus = ficha.acerto_bonus || 0;
        const acertoTotal = acertoBase + acertoBonus;
        setElement('acertoValor', acertoTotal);



        // Status - Nível
        setElement('nivel', ficha.nivel || 0);

        // Status - Vida
        const vidaMaximaBase = ficha.vida_maxima || 0;
        const vidaMaximaBonus = ficha.vida_maxima_bonus || 0;
        const vidaMaximaTotal = vidaMaximaBase + vidaMaximaBonus;
        setElement('vidaAtual', ficha.vida_atual || 0);
        setElement('vidaMaxima-view', vidaMaximaTotal);
        setInputSafe('vidaMaxima', vidaMaximaBase);
        const vidaBar = document.getElementById('vidaBar');
        const vidaPercent = document.getElementById('vidaPercent');
        if (vidaBar && vidaMaximaTotal) {
            const vidaPercentage = (ficha.vida_atual / vidaMaximaTotal) * 100;
            vidaBar.style.width = vidaPercentage + '%';
            if (vidaPercent) vidaPercent.textContent = Math.round(vidaPercentage) + '%';
        }

        // Status - Estamina
        const estaminaMaximaBase = ficha.estamina_maxima || 0;
        const estaminaMaximaBonus = ficha.estamina_maxima_bonus || 0;
        const estaminaMaximaTotal = estaminaMaximaBase + estaminaMaximaBonus;
        setElement('estaminaAtual', ficha.estamina_atual || 0);
        setElement('estaminaMaxima-view', estaminaMaximaTotal);
        setInputSafe('estaminaMaxima', estaminaMaximaBase);
        const estaminaBar = document.getElementById('estaminaBar');
        const estaminaPercent = document.getElementById('estaminaPercent');
        if (estaminaBar && estaminaMaximaTotal) {
            const estaminaPercentage = (ficha.estamina_atual / estaminaMaximaTotal) * 100;
            estaminaBar.style.width = estaminaPercentage + '%';
            if (estaminaPercent) estaminaPercent.textContent = Math.round(estaminaPercentage) + '%';
        }

        // Status - Mana
        const manaMaximaBase = ficha.mana_maxima || 0;
        const manaMaximaBonus = ficha.mana_maxima_bonus || 0;
        const manaMaximaTotal = manaMaximaBase + manaMaximaBonus;
        setElement('manaAtual', ficha.mana_atual || 0);
        setElement('manaMaxima-view', manaMaximaTotal);
        setInputSafe('manaMaxima', manaMaximaBase);
        const manaBar = document.getElementById('manaBar');
        const manaPercent = document.getElementById('manaPercent');
        if (manaBar && manaMaximaTotal) {
            const manaPercentage = (ficha.mana_atual / manaMaximaTotal) * 100;
            manaBar.style.width = manaPercentage + '%';
            if (manaPercent) manaPercent.textContent = Math.round(manaPercentage) + '%';
        }

        // Habilidades
        setElement('fragmentoDivino', ficha.fragmento_divino || '-');

        // Passivas - lista de habilidades passivas
        const passivasList = document.getElementById('passivas-list');
        if (passivasList) {
            passivasList.innerHTML = '';
            if (ficha.passiva && Array.isArray(ficha.passiva)) {
                ficha.passiva.forEach(passiva => {
                    const li = document.createElement('li');
                    li.textContent = passiva;
                    passivasList.appendChild(li);
                });
            } else if (ficha.passiva) {
                // Se for string, assumir separado por vírgula
                const passivasArray = ficha.passiva.split(',').map(p => p.trim());
                passivasArray.forEach(passiva => {
                    const li = document.createElement('li');
                    li.textContent = passiva;
                    passivasList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = '-';
                passivasList.appendChild(li);
            }
        }

        // Guardar dados da ficha para usar no modal de combate
        window.fichaData = ficha;

        // Recalcular bônus globais ao carregar a ficha
        if (typeof recalcularBonusGlobais === 'function') {
            await recalcularBonusGlobais(fichaId);
        }

        // Recarregar listas dinâmicas (magias, habilidades, itens, etc.) para refletir turnos restantes
        if (typeof carregarMagias === 'function') {
            await Promise.all([
                carregarMagias(),
                carregarHabilidades(),
                carregarItens(),
                carregarConhecimentos?.(),
                carregarAnotacoes?.(),
                carregarPassivas?.()
            ]);
        }

        if (loadingState) loadingState.style.display = 'none';
        if (fichaContent) fichaContent.style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar ficha:', error);
        if (loadingState) loadingState.style.display = 'none';
    }
}

function voltarParaFichas() {
    window.location.href = 'fichas.html';
}

function irParaCombate() {
    if (!fichaId) {
        console.error('Erro: ID da ficha não encontrado');
        return;
    }
    // Abrir em um pop-up
    const url = `controle-combate.html?id=${fichaId}`;
    const popup = window.open(url, 'combate', 'width=900,height=700,left=100,top=100');
    if (!popup) {
        console.warn('Pop-up bloqueado. Permita pop-ups para abrir combate.');
    }
}

function editarFicha() {
    window.location.href = `criar-ficha.html?id=${fichaId}`;
}

function switchTab(tabName) {
    // Ocultar todas as abas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remover classe active de todos os botões
    const buttons = document.querySelectorAll('.ficha-tab');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Mostrar aba selecionada
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Adicionar classe active ao botão clicado
    event.target.classList.add('active');
}


// ============================================
// HISTÓRICO DE ROLAGENS DE DADOS
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
    if (!key) {
        renderHistoricoDados([]);
        return;
    }

    try {
        const historico = JSON.parse(localStorage.getItem(key) || '[]');
        renderHistoricoDados(Array.isArray(historico) ? historico : []);
    } catch (err) {
        console.error('Erro ao carregar histórico de dados:', err);
        renderHistoricoDados([]);
    }
}

function registrarHistoricoDado(entry) {
    const key = getHistoricoKey();
    if (!key) return;

    let historico = [];

    try {
        historico = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(historico)) historico = [];
    } catch (err) {
        historico = [];
    }

    historico.unshift(entry);
    if (historico.length > HISTORICO_DADOS_MAX) {
        historico.length = HISTORICO_DADOS_MAX;
    }

    localStorage.setItem(key, JSON.stringify(historico));
    renderHistoricoDados(historico);
}

function renderHistoricoDados(historico) {
    const tbody = document.getElementById('diceHistoryBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!historico || historico.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.style.textAlign = 'center';
        cell.textContent = 'Sem rolagens registradas ainda.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    historico.forEach((item) => {
        const row = document.createElement('tr');

        const dataCell = document.createElement('td');
        dataCell.textContent = new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false });
        row.appendChild(dataCell);

        const itemCell = document.createElement('td');
        itemCell.textContent = item.nome || '-';
        row.appendChild(itemCell);

        const totalCell = document.createElement('td');
        totalCell.textContent = item.total ?? '-';
        row.appendChild(totalCell);

        const detalhesCell = document.createElement('td');
        detalhesCell.textContent = item.detalhes || '-';
        row.appendChild(detalhesCell);

        tbody.appendChild(row);
    });
}
