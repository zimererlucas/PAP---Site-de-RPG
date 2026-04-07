// Página de Fichas - Listagem

let todasFichas = [];

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;

    // Carregar fichas
    await loadFichas();

    // Ativar pesquisa por nome
    const searchInput = document.getElementById('fichaSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const termo = this.value.trim().toLowerCase();
            if (!termo) {
                renderFichas(todasFichas);
                return;
            }
            const filtradas = todasFichas.filter(f =>
                (f.nome || '').toLowerCase().includes(termo)
            );
            renderFichas(filtradas);
        });
    }
});

async function loadFichas() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    try {
        const result = await getPersonagensDoUsuario();

        if (!result.success) {
            console.error('Erro ao carregar fichas:', result.error);
            loadingState.style.display = 'none';
            return;
        }

        const fichas = result.data || [];
        todasFichas = fichas;
        loadingState.style.display = 'none';

        if (fichas.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        // Renderizar fichas iniciais
        renderFichas(fichas);
        updateProgressFichas();

    } catch (error) {
        console.error('Erro ao carregar fichas:', error);
        loadingState.style.display = 'none';
    }
}

function renderFichas(lista) {
    const fichasContainer = document.getElementById('fichasContainer');
    if (!fichasContainer) return;

    if (!lista || lista.length === 0) {
        fichasContainer.innerHTML = `
            <div class="col-12 text-center text-muted py-4">
                Nenhuma ficha encontrada para essa pesquisa.
            </div>
        `;
        return;
    }

    fichasContainer.innerHTML = lista.map(ficha => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 glass-card" 
                style="background: rgba(245, 232, 255, 0.055);
                    backdrop-filter: blur(6px);
                    border-radius: 20px;
                    box-shadow: 0 px 20px rgba(0, 0, 0, 0.15);">

                <div class="card-header" style="background: transparent; border-bottom: 2px solid rgba(149, 129, 235, 0.53);">
                    <h5 class="card-title mb-0" style="color: #e0e0e0; font-weight: 600;">${ficha.nome}</h5>
                </div>
                <div class="card-body">
                    <p class="card-text" style="color: #e0e0e0;">
                        <strong style="color: #e0e0e0;">Raca:</strong> ${ficha.raca || '-'}<br>
                        <strong style="color: #e0e0e0;">Nivel:</strong> ${ficha.nivel || 0}<br>
                        <strong style="color: #e0e0e0;">Vida:</strong> ${ficha.vida_atual || 0}/${ficha.vida_maxima || 0}<br>
                        <strong style="color: #e0e0e0;">Estamina:</strong> ${ficha.estamina_atual || 0}/${ficha.estamina_maxima || 0}
                    </p>
                </div>
                <div class="card-footer" style="background: transparent; border-top: 2px solid rgba(149, 129, 235, 0.53);">
                    <button class="btn btn-sm" style="background-color: rgba(149, 129, 235, 0.53); border-color: rgba(149, 129, 235, 0.53); color: white;" onclick="viewFicha('${ficha.id}')">Visualizar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFicha('${ficha.id}')">Deletar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateProgressFichas() {
    const container = document.getElementById('fichas-progress-container');
    const text = document.getElementById('fichas-progress-text');
    const bar = document.getElementById('fichas-progress-bar');
    if (!container || !text || !bar) return;

    container.style.display = 'block';
    
    // Verifica cargo de administrador injetado por auth.js
    const isAdmin = window.currentUserProfile && window.currentUserProfile.is_admin;
    const maxFichas = 5;
    const current = todasFichas.length;

    if (isAdmin) {
        text.textContent = `Fichas: ${current} / ∞ (Administrador)`;
        bar.style.width = '100%';
        bar.style.backgroundColor = '#10b981'; // Verde indicando privilégio admin
    } else {
        text.textContent = `Fichas: ${current} / ${maxFichas}`;
        const pct = Math.min((current / maxFichas) * 100, 100);
        bar.style.width = `${pct}%`;
        
        if (current >= maxFichas) {
            bar.style.backgroundColor = '#ef4444'; // Vermelho lotado
            text.style.color = '#ef4444';
        } else {
            bar.style.backgroundColor = '#667eea';
            text.style.color = '#667eea';
        }
    }
}

async function createNewFicha() {
    const isAdmin = window.currentUserProfile && window.currentUserProfile.is_admin;

    if (!isAdmin && todasFichas && todasFichas.length >= 5) {
        alert('Limite atingido: você só pode ter até 5 fichas (personagens). Como administrador os limites não se aplicam.');
        return;
    }

    const defaultFicha = {
        nome: 'Nova Ficha'
    };

    try {
        const result = await createPersonagem(defaultFicha);

        if (result.success && result.data) {
            window.location.href = `visualizar-ficha.html?id=${result.data.id}`;
        } else {
            console.error('Ocorreu um erro ao criar a nova ficha:', result.error);
        }
    } catch (error) {
        console.error("Erro ao criar ficha:", error);
    }
}

function viewFicha(id) {
    window.location.href = `visualizar-ficha.html?id=${id}`;
}

function editFicha(id) {
    window.location.href = `criar-ficha.html?id=${id}`;
}

async function deleteFicha(id) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar esta ficha?');
    if (!confirmed) return;
    
    const result = await deletePersonagem(id);
    
    if (result.success) {
        await loadFichas();
    } else {
        console.error('Erro ao deletar ficha:', result.error);
    }
}

async function handleLogout() {
    const result = await signOutUser();
    
    if (result.success) {
        window.location.href = '../index.html';
    } else {
        console.error('Erro ao fazer logout:', result.error);
    }
}
