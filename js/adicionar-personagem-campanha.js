// Página de Adicionar Personagem à Campanha

let campanhaId = null;
let personagemSelecionado = null;

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
    const content = document.getElementById('content');
    
    try {
        const result = await getCampanhaById(campanhaId);
        
        if (!result.success) {
            alert('Erro ao carregar campanha: ' + result.error);
            loadingState.style.display = 'none';
            return;
        }
        
        const campanha = result.data;
        
        // Preencher informações da campanha
        document.getElementById('campanhaName').textContent = campanha.nome;
        document.getElementById('campanhaDesc').textContent = campanha.descricao || '-';
        
        loadingState.style.display = 'none';
        content.style.display = 'block';
        
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
    
    try {
        const result = await getPersonagensDoUsuario();
        
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
        
        // Renderizar personagens
        container.innerHTML = personagens.map(p => `
            <div class="card mb-3 personagem-card" onclick="selecionarPersonagem('${p.id}', this)">
                <div class="card-body">
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="personagem" id="personagem_${p.id}" value="${p.id}">
                        <label class="form-check-label w-100" for="personagem_${p.id}">
                            <strong>🎮 ${p.nome}</strong>
                            <br>
                            <small class="text-muted">
                                Raça: ${p.raca || '-'} | Nível: ${p.nivel || 0} | Vida: ${p.vida_atual || 0}/${p.vida_maxima || 0}
                            </small>
                        </label>
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

function selecionarPersonagem(id, element) {
    personagemSelecionado = id;
    
    // Remover seleção anterior
    document.querySelectorAll('.personagem-card').forEach(card => {
        card.classList.remove('border-primary', 'border-3');
    });
    
    // Adicionar seleção nova
    element.classList.add('border-primary', 'border-3');
    
    // Mostrar botão de adicionar
    document.getElementById('botaoContainer').style.display = 'block';
    
    // Marcar radio button
    document.getElementById(`personagem_${id}`).checked = true;
}

async function adicionarPersonagem() {
    if (!personagemSelecionado) {
        alert('Selecione um personagem!');
        return;
    }
    
    const result = await adicionarJogadorACampanha(campanhaId, personagemSelecionado);
    
    if (result.success) {
        alert('Personagem adicionado à campanha com sucesso!');
        window.location.href = `visualizar-campanha-jogador.html?id=${campanhaId}`;
    } else {
        alert('Erro ao adicionar personagem: ' + result.error);
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
