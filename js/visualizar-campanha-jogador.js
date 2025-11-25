// Página de Visualizar Campanha (Jogador)

let campanhaId = null;
let meuPersonagemId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Obter ID da campanha da URL
    const params = new URLSearchParams(window.location.search);
    campanhaId = params.get('id');
    
    if (!campanhaId) {
        alert('Campanha não encontrada!');
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
            alert('Erro ao carregar campanha: ' + result.error);
            loadingState.style.display = 'none';
            return;
        }
        
        const campanha = result.data;
        
        // Preencher informações da campanha
        document.getElementById('campanhaTitle').textContent = `🎭 ${campanha.nome}`;
        document.getElementById('descricao').textContent = campanha.descricao || '-';
        document.getElementById('status').textContent = campanha.ativa ? '✅ Ativa' : '❌ Inativa';
        
        loadingState.style.display = 'none';
        campanhaContent.style.display = 'block';
        
        // Carregar personagens
        await loadPersonagens();
        
    } catch (error) {
        console.error('Erro ao carregar campanha:', error);
        alert('Erro ao carregar campanha');
        loadingState.style.display = 'none';
    }
}

async function loadPersonagens() {
    const loadingPersonagens = document.getElementById('loadingPersonagens');
    const emptyPersonagens = document.getElementById('emptyPersonagens');
    const container = document.getElementById('personagensContainer');
    const seuPersonagemDiv = document.getElementById('seuPersonagem');
    
    try {
        const user = await getCurrentUser();
        console.log('User atual:', user);
        
        const result = await getPersonagensDAcampanha(campanhaId);
        console.log('Resultado getPersonagensDAcampanha:', result);
        
        if (!result.success) {
            console.error('Erro ao carregar personagens:', result.error);
            loadingPersonagens.style.display = 'none';
            emptyPersonagens.style.display = 'block';
            return;
        }
        
        const personagens = result.data || [];
        console.log('Personagens carregados:', personagens);
        console.log('Total de personagens:', personagens.length);
        
        // Filtrar apenas personagens válidos
        const personagensValidos = personagens.filter(p => p.personagem && p.personagem.id);
        console.log('Personagens válidos:', personagensValidos);
        
        if (personagensValidos.length === 0) {
            console.log('Nenhum personagem válido encontrado');
            loadingPersonagens.style.display = 'none';
            emptyPersonagens.style.display = 'block';
            return;
        }
        
        // Separar seu personagem dos outros
        const seuPersonagem = personagensValidos.find(p => p.jogador_id === user.id);
        const outrosPersonagens = personagensValidos.filter(p => p.jogador_id !== user.id);
        console.log('Seu personagem:', seuPersonagem);
        console.log('Outros personagens:', outrosPersonagens);
        
        // Mostrar seu personagem
        if (seuPersonagem) {
            meuPersonagemId = seuPersonagem.personagem.id;
            seuPersonagemDiv.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h6>🎮 ${seuPersonagem.personagem.nome}</h6>
                        <p class="text-light small">
                            <strong>Raça:</strong> ${seuPersonagem.personagem.raca || '-'}
                        </p>
                        <p class="text-light small">
                            <strong>Nível:</strong> ${seuPersonagem.personagem.nivel || 0}
                        </p>
                        <p class="text-light small">
                            <strong>Vida:</strong> ${seuPersonagem.personagem.vida_atual || 0} / ${seuPersonagem.personagem.vida_maxima || 0}
                        </p>
                        <p class="text-light small">
                            <strong>Estamina:</strong> ${seuPersonagem.personagem.estamina_atual || 0} / ${seuPersonagem.personagem.estamina_maxima || 0}
                        </p>
                        <button class="btn btn-sm btn-primary" onclick="viewPersonagem('${seuPersonagem.personagem.id}')">👁️ Ver Ficha Completa</button>
                    </div>
                </div>
            `;
        }
        
        loadingPersonagens.style.display = 'none';
        
        // Renderizar outros personagens
        console.log('Renderizando', outrosPersonagens.length, 'outros personagens');
        if (outrosPersonagens.length === 0) {
            console.log('Mostrando mensagem de nenhum outro personagem');
            container.innerHTML = '<div class="alert alert-info">Nenhum outro personagem nesta campanha.</div>';
        } else {
            container.innerHTML = outrosPersonagens.map(p => `
                <div class="col-md-6 col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">🎮 ${p.personagem.nome}</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-light small">
                                <strong>Raça:</strong> ${p.personagem.raca || '-'}
                            </p>
                            <p class="text-light small">
                                <strong>Nível:</strong> ${p.personagem.nivel || 0}
                            </p>
                            <p class="text-light small">
                                <strong>Vida:</strong> ${p.personagem.vida_atual || 0} / ${p.personagem.vida_maxima || 0}
                            </p>
                            <p class="text-light small">
                                <strong>Estamina:</strong> ${p.personagem.estamina_atual || 0} / ${p.personagem.estamina_maxima || 0}
                            </p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <small class="text-light">Personagem de outro jogador</small>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Erro ao carregar personagens:', error);
        loadingPersonagens.style.display = 'none';
        emptyPersonagens.style.display = 'block';
    }
}

function viewPersonagem(id) {
    window.location.href = `visualizar-ficha.html?id=${id}`;
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
