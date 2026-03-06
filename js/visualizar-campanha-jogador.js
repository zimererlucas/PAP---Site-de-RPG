// Página de Visualizar Campanha (Jogador)

let campanhaId = null;
let meuPersonagemId = null;

document.addEventListener('DOMContentLoaded', async function () {
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

    // Iniciar UI compartilhada de turnos (iniciativa + histórico)
    carregarIniciativa();
    iniciarHistoricoDadosCampanha();
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
        document.getElementById('status').textContent = campanha.ativa ? '✅ Ativa' : '❌ Inativa';

        loadingState.style.display = 'none';
        campanhaContent.style.display = 'block';

        // Carregar personagens
        await loadPersonagens();

    } catch (error) {
        console.error('Erro ao carregar campanha:', error);
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

        // Mostrar seu personagem (se existir o container correspondente)
        if (seuPersonagem && seuPersonagemDiv) {
            meuPersonagemId = seuPersonagem.personagem.id;
            seuPersonagemDiv.innerHTML = `
                <div class="card" style="background: rgba(26, 42, 78, 0.4); border: 2px solid #667eea; backdrop-filter: blur(8px);">
                    <div class="card-body">
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <img src="${seuPersonagem.personagem.foto_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="" class="zoomable-image" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #667eea; ${!seuPersonagem.personagem.foto_url ? 'background: linear-gradient(135deg, #1a2a4e 0%, #667eea 100%);' : ''}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; this.style.background='linear-gradient(135deg, #1a2a4e 0%, #667eea 100%)'">
                            <div style="flex-grow: 1;">
                                <h6 style="color: #fff; font-weight: 700; margin-bottom: 10px;">🎮 ${seuPersonagem.personagem.nome}</h6>
                                <div style="font-size: 0.9em; color: #e0e0e0; line-height: 1.4;">
                                    <div><strong style="color: #667eea; font-size: 0.8em; text-transform: uppercase;">Raça:</strong> ${seuPersonagem.personagem.raca || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.8em; text-transform: uppercase;">Idade:</strong> ${seuPersonagem.personagem.idade || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.8em; text-transform: uppercase;">Nível:</strong> ${seuPersonagem.personagem.nivel || 0}</div>
                                    <div style="display: flex; gap: 10px;">
                                        <div><strong style="color: #667eea; font-size: 0.8em; text-transform: uppercase;">Altura:</strong> ${seuPersonagem.personagem.altura || '-'}</div>
                                        <div><strong style="color: #667eea; font-size: 0.8em; text-transform: uppercase;">Peso:</strong> ${seuPersonagem.personagem.peso || '-'}</div>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-primary w-100 mt-3" onclick="viewPersonagem('${seuPersonagem.personagem.id}')" style="background: #667eea; border: none;">👁️ Ver Ficha Completa</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (seuPersonagem && !seuPersonagemDiv) {
            console.warn('Elemento #seuPersonagem não encontrado na página, pulando destaque do personagem.');
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
                    <div class="card" style="background: rgba(26, 42, 78, 0.4); border: 1px solid rgba(102, 126, 234, 0.3); backdrop-filter: blur(8px); margin-bottom: 20px;">
                        <div class="card-header" style="background: rgba(102, 126, 234, 0.1); border-bottom: 1px solid rgba(102, 126, 234, 0.2);">
                            <h6 class="card-title mb-0" style="color: #fff; font-weight: 600;">🎮 ${p.personagem.nome}</h6>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                <img src="${p.personagem.foto_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="" class="zoomable-image" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 1px solid #667eea; ${!p.personagem.foto_url ? 'background: linear-gradient(135deg, #1a2a4e 0%, #667eea 100%);' : ''}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; this.style.background='linear-gradient(135deg, #1a2a4e 0%, #667eea 100%)'">
                                <div style="flex-grow: 1; font-size: 0.85em; color: #e0e0e0; line-height: 1.3;">
                                    <div><strong style="color: #667eea; font-size: 0.75em; text-transform: uppercase;">Raça:</strong> ${p.personagem.raca || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.75em; text-transform: uppercase;">Idade:</strong> ${p.personagem.idade || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.75em; text-transform: uppercase;">Nível:</strong> ${p.personagem.nivel || 0}</div>
                                    <div style="display: flex; gap: 8px;">
                                        <div><strong style="color: #667eea; font-size: 0.75em; text-transform: uppercase;">Altura:</strong> ${p.personagem.altura || '-'}</div>
                                        <div><strong style="color: #667eea; font-size: 0.75em; text-transform: uppercase;">Peso:</strong> ${p.personagem.peso || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-0">
                            <small class="text-muted small">Personagem de outro jogador</small>
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
        window.location.href = '../index.html';
    } else {
        console.error('Erro ao fazer logout:', result.error);
    }
}
