// Página de Criar/Editar Ficha

let editingId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Verificar se está editando
    const params = new URLSearchParams(window.location.search);
    editingId = params.get('id');
    
    if (editingId) {
        await loadFichaForEditing(editingId);
    }
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    const attributeInputs = document.querySelectorAll('.attribute-base, .attribute-bonus');
    attributeInputs.forEach(input => {
        input.addEventListener('input', calculateAttributeTotals);
    });
    
    document.getElementById('characterForm').addEventListener('submit', handleFormSubmit);
}

function calculateAttributeTotals() {
    const attributes = ['forca', 'agilidade', 'sorte', 'inteligencia', 'corpoEssencia', 'exposicaoRunica'];
    
    attributes.forEach(attr => {
        const baseInput = document.querySelector(`.attribute-base[data-attr="${attr}"]`);
        const bonusInput = document.querySelector(`.attribute-bonus[data-attr="${attr}"]`);
        const totalSpan = document.querySelector(`.attribute-total[data-attr="${attr}"]`);
        
        if (baseInput && bonusInput && totalSpan) {
            const base = parseInt(baseInput.value) || 0;
            const bonus = parseInt(bonusInput.value) || 0;
            const total = base + bonus;
            
            totalSpan.textContent = total;
        }
    });
}

async function loadFichaForEditing(id) {
    try {
        const result = await getPersonagemById(id);
        
        if (!result.success) {
            alert('Erro ao carregar ficha: ' + result.error);
            return;
        }
        
        const ficha = result.data;
        
        // Preencher formulário
        document.getElementById('nome').value = ficha.nome || '';
        document.getElementById('idade').value = ficha.idade || '';
        document.getElementById('raca').value = ficha.raca || '';
        document.getElementById('altura').value = ficha.altura || '';
        document.getElementById('peso').value = ficha.peso || '';
        
        // Atributos
        document.querySelector('.attribute-base[data-attr="forca"]').value = ficha.forca_base || 0;
        document.querySelector('.attribute-bonus[data-attr="forca"]').value = ficha.forca_bonus || 0;
        document.querySelector('.attribute-base[data-attr="agilidade"]').value = ficha.agilidade_base || 0;
        document.querySelector('.attribute-bonus[data-attr="agilidade"]').value = ficha.agilidade_bonus || 0;
        document.querySelector('.attribute-base[data-attr="sorte"]').value = ficha.sorte_base || 0;
        document.querySelector('.attribute-bonus[data-attr="sorte"]').value = ficha.sorte_bonus || 0;
        document.querySelector('.attribute-base[data-attr="inteligencia"]').value = ficha.inteligencia_base || 0;
        document.querySelector('.attribute-bonus[data-attr="inteligencia"]').value = ficha.inteligencia_bonus || 0;
        document.querySelector('.attribute-base[data-attr="corpoEssencia"]').value = ficha.corpo_essencia_base || 0;
        document.querySelector('.attribute-bonus[data-attr="corpoEssencia"]').value = ficha.corpo_essencia_bonus || 0;
        document.querySelector('.attribute-base[data-attr="exposicaoRunica"]').value = ficha.exposicao_runica_base || 0;
        document.querySelector('.attribute-bonus[data-attr="exposicaoRunica"]').value = ficha.exposicao_runica_bonus || 0;
        
        document.getElementById('tempoReacao').value = ficha.tempo_reacao || 0;
        document.getElementById('reputacao').value = ficha.reputacao || '';
        
        // Status
        document.getElementById('nivel').value = ficha.nivel || 0;
        document.getElementById('vidaAtual').value = ficha.vida_atual || 0;
        document.getElementById('vidaMaxima').value = ficha.vida_maxima || 0;
        document.getElementById('estaminaAtual').value = ficha.estamina_atual || 0;
        document.getElementById('estaminaMaxima').value = ficha.estamina_maxima || 0;
        document.getElementById('manaAtual').value = ficha.mana_atual || 0;
        document.getElementById('manaMaxima').value = ficha.mana_maxima || 0;
        document.getElementById('poderMagico').value = ficha.poder_magico || 0;
        document.getElementById('controle').value = ficha.controle || 0;
        
        // Habilidades
        document.getElementById('fragmentoDivino').value = ficha.fragmento_divino || '';
        document.getElementById('passiva').value = ficha.passiva || '';
        
        calculateAttributeTotals();
        
    } catch (error) {
        console.error('Erro ao carregar ficha:', error);
        alert('Erro ao carregar ficha');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    
    if (!nome.trim()) {
        alert('Nome do personagem é obrigatório!');
        return;
    }
    
    const ficha = {
        nome: nome,
        idade: parseInt(document.getElementById('idade').value) || null,
        raca: document.getElementById('raca').value || null,
        altura: parseInt(document.getElementById('altura').value) || null,
        peso: parseInt(document.getElementById('peso').value) || null,
        
        // Atributos
        forca_base: parseInt(document.querySelector('.attribute-base[data-attr="forca"]').value) || 0,
        forca_bonus: parseInt(document.querySelector('.attribute-bonus[data-attr="forca"]').value) || 0,
        agilidade_base: parseInt(document.querySelector('.attribute-base[data-attr="agilidade"]').value) || 0,
        agilidade_bonus: parseInt(document.querySelector('.attribute-bonus[data-attr="agilidade"]').value) || 0,
        sorte_base: parseInt(document.querySelector('.attribute-base[data-attr="sorte"]').value) || 0,
        sorte_bonus: parseInt(document.querySelector('.attribute-bonus[data-attr="sorte"]').value) || 0,
        inteligencia_base: parseInt(document.querySelector('.attribute-base[data-attr="inteligencia"]').value) || 0,
        inteligencia_bonus: parseInt(document.querySelector('.attribute-bonus[data-attr="inteligencia"]').value) || 0,
        corpo_essencia_base: parseInt(document.querySelector('.attribute-base[data-attr="corpoEssencia"]').value) || 0,
        corpo_essencia_bonus: parseInt(document.querySelector('.attribute-bonus[data-attr="corpoEssencia"]').value) || 0,
        exposicao_runica_base: parseInt(document.querySelector('.attribute-base[data-attr="exposicaoRunica"]').value) || 0,
        exposicao_runica_bonus: parseInt(document.querySelector('.attribute-bonus[data-attr="exposicaoRunica"]').value) || 0,
        
        tempo_reacao: parseInt(document.getElementById('tempoReacao').value) || 0,
        reputacao: document.getElementById('reputacao').value || null,
        
        // Status
        nivel: parseInt(document.getElementById('nivel').value) || 0,
        vida_atual: parseInt(document.getElementById('vidaAtual').value) || 0,
        vida_maxima: parseInt(document.getElementById('vidaMaxima').value) || 0,
        estamina_atual: parseInt(document.getElementById('estaminaAtual').value) || 0,
        estamina_maxima: parseInt(document.getElementById('estaminaMaxima').value) || 0,
        mana_atual: parseInt(document.getElementById('manaAtual').value) || 0,
        mana_maxima: parseInt(document.getElementById('manaMaxima').value) || 0,
        poder_magico: parseInt(document.getElementById('poderMagico').value) || 0,
        controle: parseInt(document.getElementById('controle').value) || 0,
        
        // Habilidades
        fragmento_divino: document.getElementById('fragmentoDivino').value || null,
        passiva: document.getElementById('passiva').value || null
    };
    
    const btn = document.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Salvando...';
    
    let result;
    if (editingId) {
        result = await updatePersonagem(editingId, ficha);
    } else {
        result = await createPersonagem(ficha);
    }
    
    btn.disabled = false;
    btn.textContent = originalText;
    
    if (result.success) {
        alert('✅ Ficha salva com sucesso!');
        window.location.href = 'fichas.html';
    } else {
        alert('❌ Erro ao salvar ficha: ' + result.error);
    }
}

async function handleLogout() {
    const result = await signOutUser();
    
    if (result.success) {
        alert('Logout realizado com sucesso!');
        window.location.href = '../index.html';
    } else {
        alert('Erro ao fazer logout: ' + result.error);
    }
}
