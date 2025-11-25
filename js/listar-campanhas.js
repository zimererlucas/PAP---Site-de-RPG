// Página de Campanhas - Listagem

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Carregar campanhas como narrador
    await loadCampanhasNarrador();
    
    // Carregar campanhas como jogador
    await loadCampanhasJogador();
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    const form = document.getElementById('entrarCampanhaForm');
    if (form) {
        form.addEventListener('submit', handleEntrarCampanha);
    }
}

async function loadCampanhasNarrador() {
    const loadingState = document.getElementById('loadingNarrador');
    const emptyState = document.getElementById('emptyNarrador');
    const container = document.getElementById('campanhasNarradorContainer');
    
    try {
        const result = await getCampanhasDoUsuario();
        
        if (!result.success) {
            alert('Erro ao carregar campanhas: ' + result.error);
            loadingState.style.display = 'none';
            return;
        }
        
        const campanhas = result.data || [];
        loadingState.style.display = 'none';
        
        if (campanhas.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        // Renderizar campanhas
        container.innerHTML = campanhas.map(campanha => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100" style="background:rgba(245, 232, 255, 0.055); border: 2px solid rgba(149, 129, 235, 0.53); color: #e0e0e0;">
                    <div class="card-header" style="background: transparent; border-bottom: 2px solid rgba(149, 129, 235, 0.53);">
                        <h5 class="card-title mb-0" style="color: #667eea; font-weight: 600;">🎭 ${campanha.nome}</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text" style="color: #b0b0b0;">${campanha.descricao || 'Sem descricao'}</p>
                        <p style="color: #888; font-size: 0.9em;">
                            <strong style="color: #e0e0e0;">Codigo:</strong> <code style="color: #667eea;">${campanha.codigo}</code>
                        </p>
                        <p style="color: #888; font-size: 0.9em;">
                            <strong style="color: #e0e0e0;">Status:</strong> ${campanha.ativa ? '✅ Ativa' : '❌ Inativa'}
                        </p>
                    </div>
                    <div class="card-footer" style="background: transparent; border-top: 2px solid rgba(149, 129, 235, 0.53);">
                        <button class="btn btn-sm" style="background-color: #667eea; border-color: #667eea; color: white;" onclick="viewCampanha('${campanha.id}')">Visualizar</button>
                        <button class="btn btn-sm" style="background-color: #667eea; border-color: #667eea; color: white;" onclick="adicionarPersonagemNarrador('${campanha.id}')">Adicionar Jogador</button>
                        <button class="btn btn-sm btn-warning" onclick="editCampanha('${campanha.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCampanhaConfirm('${campanha.id}')">Deletar</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        alert('Erro ao carregar campanhas');
        loadingState.style.display = 'none';
    }
}

async function loadCampanhasJogador() {
    const loadingState = document.getElementById('loadingJogador');
    const emptyState = document.getElementById('emptyJogador');
    const container = document.getElementById('campanhasJogadorContainer');
    
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        // Obter campanhas onde o usuário participa
        const { data, error } = await supabase
            .from('campanha_personagens')
            .select(`
                *,
                campanha:campanha_id(
                    id, nome, descricao, codigo, narrador_id, ativa
                ),
                personagem:personagem_id(
                    id, nome, raca
                )
            `)
            .eq('jogador_id', user.id);
        
        if (error) {
            console.error('Erro ao carregar campanhas do jogador:', error);
            loadingState.style.display = 'none';
            return;
        }
        
        const participacoes = data || [];
        loadingState.style.display = 'none';
        
        if (participacoes.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        // Renderizar campanhas
        container.innerHTML = participacoes.map(participacao => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100" style="background: rgba(245, 232, 255, 0.055); border: 2px solid rgba(149, 129, 235, 0.53); color: #e0e0e0;">
                    <div class="card-header" style="background: transparent; border-bottom: 2px solid rgba(149, 129, 235, 0.53);">
                        <h5 class="card-title mb-0" style="color: #667eea; font-weight: 600;">🎭 ${participacao.campanha.nome}</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text" style="color: #b0b0b0;">${participacao.campanha.descricao || 'Sem descricao'}</p>
                        <p style="color: #888; font-size: 0.9em;">
                            <strong style="color: #e0e0e0;">Seu Personagem:</strong> ${participacao.personagem.nome}
                        </p>
                        <p style="color: #888; font-size: 0.9em;">
                            <strong style="color: #e0e0e0;">Status:</strong> ${participacao.campanha.ativa ? '✅ Ativa' : '❌ Inativa'}
                        </p>
                    </div>
                    <div class="card-footer" style="background: transparent; border-top: 2px solid rgba(149, 129, 235, 0.53);">
                        <button class="btn btn-sm" style="background-color: #667eea; border-color: #667eea; color: white;" onclick="viewCampanhaJogador('${participacao.campanha.id}')">Visualizar</button>
                        <button class="btn btn-sm btn-danger" onclick="sairDaCampanha('${participacao.id}')">Sair</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar campanhas do jogador:', error);
        alert('Erro ao carregar campanhas');
        loadingState.style.display = 'none';
    }
}

function adicionarPersonagemNarrador(id) {
    window.location.href = `adicionar-personagem-campanha.html?id=${id}`;
}

function viewCampanha(id) {
    window.location.href = `visualizar-campanha.html?id=${id}`;
}

function viewCampanhaJogador(id) {
    window.location.href = `visualizar-campanha-jogador.html?id=${id}`;
}

function editCampanha(id) {
    window.location.href = `criar-campanha.html?id=${id}`;
}

async function deleteCampanhaConfirm(id) {
    if (!confirm('Tem certeza que deseja deletar esta campanha?')) {
        return;
    }
    
    const result = await deleteCampanha(id);
    
    if (result.success) {
        alert('Campanha deletada com sucesso!');
        await loadCampanhasNarrador();
    } else {
        alert('Erro ao deletar campanha: ' + result.error);
    }
}

async function sairDaCampanha(participacaoId) {
    if (!confirm('Tem certeza que deseja sair desta campanha?')) {
        return;
    }
    
    const result = await removerJogadorDaCampanha(participacaoId);
    
    if (result.success) {
        alert('Você saiu da campanha!');
        await loadCampanhasJogador();
    } else {
        alert('Erro ao sair da campanha: ' + result.error);
    }
}

function showEntrarCampanhaModal() {
    // Carregar personagens do usuário
    loadPersonagensParaModal();
    
    const modal = new bootstrap.Modal(document.getElementById('entrarCampanhaModal'));
    modal.show();
}

async function loadPersonagensParaModal() {
    const select = document.getElementById('personagemParticipacao');
    
    const result = await getPersonagensDoUsuario();
    
    if (result.success && result.data.length > 0) {
        select.innerHTML = result.data.map(personagem => `
            <option value="${personagem.id}">${personagem.nome}</option>
        `).join('');
    } else {
        select.innerHTML = '<option value="">Nenhum personagem disponível</option>';
    }
}

async function handleEntrarCampanha(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('codigoCampanha').value.trim();
    const personagemId = document.getElementById('personagemParticipacao').value;
    
    if (!codigo || !personagemId) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    // Obter campanha pelo código
    const campanhaResult = await getCampanhaByCodigo(codigo);
    
    if (!campanhaResult.success) {
        alert('Campanha não encontrada! Verifique o código.');
        return;
    }
    
    const campanha = campanhaResult.data;
    
    // Adicionar jogador à campanha
    const result = await adicionarJogadorACampanha(campanha.id, personagemId);
    
    if (result.success) {
        alert('Você entrou na campanha com sucesso!');
        document.getElementById('entrarCampanhaForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('entrarCampanhaModal')).hide();
        await loadCampanhasJogador();
    } else {
        alert('Erro ao entrar na campanha: ' + result.error);
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
