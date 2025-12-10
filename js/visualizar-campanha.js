// Página de Visualizar Campanha (Narrador)

let campanhaId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Obter ID da campanha da URL
    const params = new URLSearchParams(window.location.search);
    campanhaId = params.get('id');
    
    if (!campanhaId) {
        console.error('Campanha não encontrada!');
        window.location.href = 'campanhas.html';
        return;
    }
    
    // Carregar campanha e personagens
    await loadCampanha();
});

async function loadCampanha() {
    const loadingState = document.getElementById('loadingState');
    const campanhaContent = document.getElementById('campanhaContent');
    
    try {
        const result = await getCampanhaById(campanhaId);
        
        if (!result.success) {
            console.error('Erro ao carregar campanha:', result.error);
            loadingState.style.display = 'none';
            return;
        }
        
        const campanha = result.data;
        
        // Preencher informações da campanha
        document.getElementById('campanhaTitle').textContent = `🎭 ${campanha.nome}`;
        document.getElementById('descricao').textContent = campanha.descricao || '-';
        document.getElementById('codigo').textContent = campanha.codigo;
        document.getElementById('status').textContent = campanha.ativa ? '✅ Ativa' : '❌ Inativa';
        
        loadingState.style.display = 'none';
        campanhaContent.style.display = 'block';
        
        // Carregar personagens
        await loadPersonagens();
        
    } catch (error) {
        console.error('Erro ao carregar campanha:', error);
        // alert('Erro ao carregar campanha'); // Removed alert
        loadingState.style.display = 'none';
    }
}

async function loadPersonagens() {
    const loadingPersonagens = document.getElementById('loadingPersonagens');
    const emptyPersonagens = document.getElementById('emptyPersonagens');
    const container = document.getElementById('personagensContainer');
    
    try {
        const result = await getPersonagensDAcampanha(campanhaId);
        
        if (!result.success) {
            console.error('Erro ao carregar personagens:', result.error);
            loadingPersonagens.style.display = 'none';
            emptyPersonagens.style.display = 'block';
            return;
        }
        
        const personagens = result.data || [];
        loadingPersonagens.style.display = 'none';
        
        if (personagens.length === 0) {
            emptyPersonagens.style.display = 'block';
            return;
        }
        
        // Renderizar personagens (filtrar apenas os com personagem válido)
        const personagensValidos = personagens.filter(p => p.personagem && p.personagem.id);
        
        if (personagensValidos.length === 0) {
            emptyPersonagens.style.display = 'block';
            return;
        }
        
        container.innerHTML = personagensValidos.map(p => `
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title mb-0">🎮 ${p.personagem.nome}</h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">
                            <strong>Raça:</strong> ${p.personagem.raca || '-'}
                        </p>
                        <p class="text-muted small">
                            <strong>Nível:</strong> ${p.personagem.nivel || 0}
                        </p>
                        <p class="text-muted small">
                            <strong>Vida:</strong> ${p.personagem.vida_atual || 0} / ${p.personagem.vida_maxima || 0}
                        </p>
                        <p class="text-muted small">
                            <strong>Estamina:</strong> ${p.personagem.estamina_atual || 0} / ${p.personagem.estamina_maxima || 0}
                        </p>
                        <p class="text-muted small">
                            <strong>Jogador:</strong> ${p.jogador.username || 'Usuário'}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-sm btn-primary" onclick="viewPersonagem('${p.personagem.id}')">👁️ Ver Ficha</button>
                        <button class="btn btn-sm btn-danger" onclick="removerJogador('${p.id}')">🗑️ Remover</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar personagens:', error);
        loadingPersonagens.style.display = 'none';
        emptyPersonagens.style.display = 'block';
    }
}

function copiarCodigo() {
    const codigo = document.getElementById('codigo').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        console.log('Código copiado para a área de transferência');
    });
}

function editarCampanha() {
    window.location.href = `criar-campanha.html?id=${campanhaId}`;
}

function viewPersonagem(id) {
    window.location.href = `visualizar-ficha.html?id=${id}`;
}

async function removerJogador(participacaoId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja remover este jogador da campanha?');
    if (!confirmed) return;
    
    const result = await removerJogadorDaCampanha(participacaoId);
    
    if (result.success) {
        console.log('Jogador removido com sucesso!');
        await loadPersonagens();
    } else {
        console.error('Erro ao remover jogador:', result.error);
    }
}

async function handleLogout() {
    const result = await signOutUser();
    
    if (result.success) {
        console.log('Logout realizado com sucesso!');
        window.location.href = '../index.html';
    } else {
        console.error('Erro ao fazer logout:', result.error);
    }
}
