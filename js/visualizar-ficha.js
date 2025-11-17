// Variável global para armazenar o ID da ficha
let fichaId = null;

// ============================================
// FUNÇÕES PARA ALTERAR VIDA, MANA E ESTAMINA (ESCOPO GLOBAL)
// ============================================

function alterarVida(valor) {
    const vidaAtualEl = document.getElementById('vidaAtual');
    const vidaMaximaEl = document.getElementById('vidaMaxima');
    
    if (!vidaAtualEl || !vidaMaximaEl) return;
    
    let vidaAtual = parseInt(vidaAtualEl.textContent) || 0;
    let vidaMaxima = parseInt(vidaMaximaEl.textContent) || 0;
    
    vidaAtual = Math.max(0, Math.min(vidaMaxima, vidaAtual + valor));
    
    vidaAtualEl.textContent = vidaAtual;
    atualizarBarraVida();
}

function alterarMana(valor) {
    const manaAtualEl = document.getElementById('manaAtual');
    const manaMaximaEl = document.getElementById('manaMaxima');
    
    if (!manaAtualEl || !manaMaximaEl) return;
    
    let manaAtual = parseInt(manaAtualEl.textContent) || 0;
    let manaMaxima = parseInt(manaMaximaEl.textContent) || 0;
    
    manaAtual = Math.max(0, Math.min(manaMaxima, manaAtual + valor));
    
    manaAtualEl.textContent = manaAtual;
    atualizarBarraMana();
}

function alterarEstamina(valor) {
    const estaminaAtualEl = document.getElementById('estaminaAtual');
    const estaminaMaximaEl = document.getElementById('estaminaMaxima');
    
    if (!estaminaAtualEl || !estaminaMaximaEl) return;
    
    let estaminaAtual = parseInt(estaminaAtualEl.textContent) || 0;
    let estaminaMaxima = parseInt(estaminaMaximaEl.textContent) || 0;
    
    estaminaAtual = Math.max(0, Math.min(estaminaMaxima, estaminaAtual + valor));
    
    estaminaAtualEl.textContent = estaminaAtual;
    atualizarBarraEstamina();
}

function atualizarBarraVida() {
    const vidaAtual = parseInt(document.getElementById('vidaAtual').textContent) || 0;
    const vidaMaxima = parseInt(document.getElementById('vidaMaxima').textContent) || 1;
    const percent = Math.round((vidaAtual / vidaMaxima) * 100);
    
    const vidaBar = document.getElementById('vidaBar');
    const vidaPercent = document.getElementById('vidaPercent');
    
    if (vidaBar) vidaBar.style.width = percent + '%';
    if (vidaPercent) vidaPercent.textContent = percent + '%';
}

function atualizarBarraMana() {
    const manaAtual = parseInt(document.getElementById('manaAtual').textContent) || 0;
    const manaMaxima = parseInt(document.getElementById('manaMaxima').textContent) || 1;
    const percent = Math.round((manaAtual / manaMaxima) * 100);
    
    const manaBar = document.getElementById('manaBar');
    const manaPercent = document.getElementById('manaPercent');
    
    if (manaBar) manaBar.style.width = percent + '%';
    if (manaPercent) manaPercent.textContent = percent + '%';
}

function atualizarBarraEstamina() {
    const estaminaAtual = parseInt(document.getElementById('estaminaAtual').textContent) || 0;
    const estaminaMaxima = parseInt(document.getElementById('estaminaMaxima').textContent) || 1;
    const percent = Math.round((estaminaAtual / estaminaMaxima) * 100);
    
    const estaminaBar = document.getElementById('estaminaBar');
    const estaminaPercent = document.getElementById('estaminaPercent');
    
    if (estaminaBar) estaminaBar.style.width = percent + '%';
    if (estaminaPercent) estaminaPercent.textContent = percent + '%';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Obter ID da ficha da URL
    const params = new URLSearchParams(window.location.search);
    fichaId = params.get('id');
    window.fichaId = fichaId; // Tornar acessível globalmente
    
    console.log('fichaId definido:', window.fichaId);
    
    if (!fichaId) {
        alert('Ficha não encontrada!');
        window.location.href = 'fichas.html';
        return;
    }
    
    // Atualizar navbar
    atualizarNavbar();
    
    // Carregar ficha
    await loadFicha();
});

function irParaLogin() {
    window.location.href = 'index.html';
}

function fazerLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    window.location.href = 'index.html';
}

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
            alert('Erro ao carregar ficha: ' + result.error);
            if (loadingState) loadingState.style.display = 'none';
            return;
        }
        
        const ficha = result.data;
        
        // Função auxiliar para setar textContent com segurança
        const setElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value || '-';
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
        
        const nomeInput = document.getElementById('nome');
        const racaInput = document.getElementById('raca');
        const idadeInput = document.getElementById('idade');
        const nivelInput = document.getElementById('nivel');
        const alturaInput = document.getElementById('altura');
        const pesoInput = document.getElementById('peso');
        if (nomeInput) nomeInput.value = ficha.nome || '';
        if (racaInput) racaInput.value = ficha.raca || '';
        if (idadeInput) idadeInput.value = ficha.idade || '';
        if (nivelInput) nivelInput.value = ficha.nivel || 0;
        if (alturaInput) alturaInput.value = ficha.altura || '';
        if (pesoInput) pesoInput.value = ficha.peso || '';
        
        // Atributos - Força
        const forcaBaseVal = ficha.forca_base || 0;
        const forcaBonusVal = ficha.forca_bonus || 0;
        const forcaTotalVal = forcaBaseVal + forcaBonusVal;
        setElement('forcaBase-view', forcaBaseVal);
        setElement('forcaBonus-view', forcaBonusVal);
        setElement('forcaTotal', forcaTotalVal);
        const forcaBaseInput = document.getElementById('forcaBase');
        const forcaBonusInput = document.getElementById('forcaBonus');
        if (forcaBaseInput) forcaBaseInput.value = forcaBaseVal;
        if (forcaBonusInput) forcaBonusInput.value = forcaBonusVal;
        
        // Atributos - Agilidade
        const agilidadeBaseVal = ficha.agilidade_base || 0;
        const agilidadeBonusVal = ficha.agilidade_bonus || 0;
        const agilidadeTotalVal = agilidadeBaseVal + agilidadeBonusVal;
        setElement('agilidadeBase-view', agilidadeBaseVal);
        setElement('agilidadeBonus-view', agilidadeBonusVal);
        setElement('agilidadeTotal', agilidadeTotalVal);
        const agilidadeBaseInput = document.getElementById('agilidadeBase');
        const agilidadeBonusInput = document.getElementById('agilidadeBonus');
        if (agilidadeBaseInput) agilidadeBaseInput.value = agilidadeBaseVal;
        if (agilidadeBonusInput) agilidadeBonusInput.value = agilidadeBonusVal;
        
        // Atributos - Sorte
        const sorteBaseVal = ficha.sorte_base || 0;
        const sorteBonusVal = ficha.sorte_bonus || 0;
        const sorteTotalVal = sorteBaseVal + sorteBonusVal;
        setElement('sorteBase-view', sorteBaseVal);
        setElement('sorteBonus-view', sorteBonusVal);
        setElement('sorteTotal', sorteTotalVal);
        const sorteBaseInput = document.getElementById('sorteBase');
        const sorteBonusInput = document.getElementById('sorteBonus');
        if (sorteBaseInput) sorteBaseInput.value = sorteBaseVal;
        if (sorteBonusInput) sorteBonusInput.value = sorteBonusVal;
        
        // Atributos - Inteligência
        const inteligenciaBaseVal = ficha.inteligencia_base || 0;
        const inteligenciaBonusVal = ficha.inteligencia_bonus || 0;
        const inteligenciaTotalVal = inteligenciaBaseVal + inteligenciaBonusVal;
        setElement('inteligenciaBase-view', inteligenciaBaseVal);
        setElement('inteligenciaBonus-view', inteligenciaBonusVal);
        setElement('inteligenciaTotal', inteligenciaTotalVal);
        const inteligenciaBaseInput = document.getElementById('inteligenciaBase');
        const inteligenciaBonusInput = document.getElementById('inteligenciaBonus');
        if (inteligenciaBaseInput) inteligenciaBaseInput.value = inteligenciaBaseVal;
        if (inteligenciaBonusInput) inteligenciaBonusInput.value = inteligenciaBonusVal;
        
        // Atributos - Corpo Essência
        const corpoEssenciaBaseVal = ficha.corpo_essencia_base || 0;
        const corpoEssenciaBonusVal = ficha.corpo_essencia_bonus || 0;
        const corpoEssenciaTotalVal = corpoEssenciaBaseVal + corpoEssenciaBonusVal;
        setElement('corpoEssenciaBase-view', corpoEssenciaBaseVal);
        setElement('corpoEssenciaBonus-view', corpoEssenciaBonusVal);
        setElement('corpoEssenciaTotal', corpoEssenciaTotalVal);
        const corpoEssenciaBaseInput = document.getElementById('corpoEssenciaBase');
        const corpoEssenciaBonusInput = document.getElementById('corpoEssenciaBonus');
        if (corpoEssenciaBaseInput) corpoEssenciaBaseInput.value = corpoEssenciaBaseVal;
        if (corpoEssenciaBonusInput) corpoEssenciaBonusInput.value = corpoEssenciaBonusVal;
        
        // Atributos - Exposição Rúnica
        const exposicaoRunicaBaseVal = ficha.exposicao_runica_base || 0;
        const exposicaoRunicaBonusVal = ficha.exposicao_runica_bonus || 0;
        const exposicaoRunicaTotalVal = exposicaoRunicaBaseVal + exposicaoRunicaBonusVal;
        setElement('exposicaoRunicaBase-view', exposicaoRunicaBaseVal);
        setElement('exposicaoRunicaBonus-view', exposicaoRunicaBonusVal);
        setElement('exposicaoRunicaTotal', exposicaoRunicaTotalVal);
        const exposicaoRunicaBaseInput = document.getElementById('exposicaoRunicaBase');
        const exposicaoRunicaBonusInput = document.getElementById('exposicaoRunicaBonus');
        if (exposicaoRunicaBaseInput) exposicaoRunicaBaseInput.value = exposicaoRunicaBaseVal;
        if (exposicaoRunicaBonusInput) exposicaoRunicaBonusInput.value = exposicaoRunicaBonusVal;
        
        // Calcular Tempo de Reação (casa da dezena do total de atributos)
        const totalAtributos = forcaTotalVal + agilidadeTotalVal + sorteTotalVal + inteligenciaTotalVal + corpoEssenciaTotalVal + exposicaoRunicaTotalVal;
        const tempoReacaoCalculado = Math.floor(totalAtributos / 10);
        console.log('Tempo de Reacao no loadFicha:', { forcaTotalVal, agilidadeTotalVal, sorteTotalVal, inteligenciaTotalVal, corpoEssenciaTotalVal, exposicaoRunicaTotalVal, totalAtributos, tempoReacaoCalculado });
        setElement('tempoReacao', tempoReacaoCalculado);
        setElement('tempoReacaoValor', tempoReacaoCalculado);
        
        // Reputação
        setElement('reputacao', ficha.reputacao || '-');
        
        // Status - Nível
        setElement('nivel', ficha.nivel || 0);
        
        // Status - Vida
        setElement('vidaAtual', ficha.vida_atual || 0);
        setElement('vidaMaxima-view', ficha.vida_maxima || 0);
        const vidaMaximaInput = document.getElementById('vidaMaxima');
        if (vidaMaximaInput) vidaMaximaInput.value = ficha.vida_maxima || 0;
        const vidaBar = document.getElementById('vidaBar');
        const vidaPercent = document.getElementById('vidaPercent');
        if (vidaBar && ficha.vida_maxima) {
            const vidaPercentage = (ficha.vida_atual / ficha.vida_maxima) * 100;
            vidaBar.style.width = vidaPercentage + '%';
            if (vidaPercent) vidaPercent.textContent = Math.round(vidaPercentage) + '%';
        }
        
        // Status - Estamina
        setElement('estaminaAtual', ficha.estamina_atual || 0);
        setElement('estaminaMaxima-view', ficha.estamina_maxima || 0);
        const estaminaMaximaInput = document.getElementById('estaminaMaxima');
        if (estaminaMaximaInput) estaminaMaximaInput.value = ficha.estamina_maxima || 0;
        const estaminaBar = document.getElementById('estaminaBar');
        const estaminaPercent = document.getElementById('estaminaPercent');
        if (estaminaBar && ficha.estamina_maxima) {
            const estaminaPercentage = (ficha.estamina_atual / ficha.estamina_maxima) * 100;
            estaminaBar.style.width = estaminaPercentage + '%';
            if (estaminaPercent) estaminaPercent.textContent = Math.round(estaminaPercentage) + '%';
        }
        
        // Status - Mana
        setElement('manaAtual', ficha.mana_atual || 0);
        setElement('manaMaxima-view', ficha.mana_maxima || 0);
        const manaMaximaInput = document.getElementById('manaMaxima');
        if (manaMaximaInput) manaMaximaInput.value = ficha.mana_maxima || 0;
        const manaBar = document.getElementById('manaBar');
        const manaPercent = document.getElementById('manaPercent');
        if (manaBar && ficha.mana_maxima) {
            const manaPercentage = (ficha.mana_atual / ficha.mana_maxima) * 100;
            manaBar.style.width = manaPercentage + '%';
            if (manaPercent) manaPercent.textContent = Math.round(manaPercentage) + '%';
        }
        
        // Poderes
        setElement('poderMagico-view', ficha.poder_magico || 0);
        setElement('controle-view', ficha.controle || 0);
        const poderMagicoInput = document.getElementById('poderMagico');
        const controleInput = document.getElementById('controle');
        if (poderMagicoInput) poderMagicoInput.value = ficha.poder_magico || 0;
        if (controleInput) controleInput.value = ficha.controle || 0;
        
        // Habilidades
        setElement('fragmentoDivino', ficha.fragmento_divino || '-');
        setElement('passiva', ficha.passiva || '-');
        
        // Guardar dados da ficha para usar no modal de combate
        window.fichaData = ficha;
        
        if (loadingState) loadingState.style.display = 'none';
        if (fichaContent) fichaContent.style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar ficha:', error);
        alert('Erro ao carregar ficha');
        if (loadingState) loadingState.style.display = 'none';
    }
}

function voltarParaFichas() {
    window.location.href = 'fichas.html';
}

function irParaCombate() {
    if (!fichaId) {
        alert('Erro: ID da ficha não encontrado');
        return;
    }
    // Abrir em um pop-up
    const url = `controle-combate.html?id=${fichaId}`;
    const popup = window.open(url, 'combate', 'width=900,height=700,left=100,top=100');
    if (!popup) {
        alert('Pop-up bloqueado! Por favor, permita pop-ups neste site.');
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
