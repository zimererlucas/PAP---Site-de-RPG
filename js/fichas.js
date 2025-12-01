// Página de Fichas - Listagem

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Carregar fichas
    await loadFichas();
});

async function loadFichas() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const fichasContainer = document.getElementById('fichasContainer');
    
    try {
        const result = await getPersonagensDoUsuario();
        
        if (!result.success) {
            alert('Erro ao carregar fichas: ' + result.error);
            loadingState.style.display = 'none';
            return;
        }
        
        const fichas = result.data || [];
        loadingState.style.display = 'none';
        
        if (fichas.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        // Renderizar fichas
        fichasContainer.innerHTML = fichas.map(ficha => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 glass-card" 
                style="background: 
                rgba(245, 232, 255, 0.055);
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
                        <button class="btn btn-sm" style="background-color: rgba(149, 129, 235, 0.53); border-color: rgba(149, 129, 235, 0.53); color: white;" onclick="editFicha('${ficha.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteFicha('${ficha.id}')">Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar fichas:', error);
        alert('Erro ao carregar fichas');
        loadingState.style.display = 'none';
    }
}

function viewFicha(id) {
    window.location.href = `visualizar-ficha.html?id=${id}`;
}

function editFicha(id) {
    window.location.href = `criar-ficha.html?id=${id}`;
}

async function deleteFicha(id) {
    if (!confirm('Tem certeza que deseja deletar esta ficha?')) {
        return;
    }
    
    const result = await deletePersonagem(id);
    
    if (result.success) {
        alert('Ficha deletada com sucesso!');
        await loadFichas();
    } else {
        alert('Erro ao deletar ficha: ' + result.error);
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
