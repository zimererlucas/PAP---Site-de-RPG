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

        // Inicializar Calendário
        await inicializarCalendario(campanha);
        assinarAtualizacoesCalendario();

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
                <div class="card custom-glass-card mb-4" style="border: 2px solid #667eea !important;">
                    <div class="card-body">
                        <div style="display: flex; gap: 20px; align-items: flex-start;">
                            <img src="${seuPersonagem.personagem.foto_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="" class="zoomable-image photo-player-main" style="border-radius: 50%; object-fit: cover; ${!seuPersonagem.personagem.foto_url ? 'background: linear-gradient(135deg, #1a2a4e 0%, #667eea 100%);' : ''}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; this.style.background='linear-gradient(135deg, #1a2a4e 0%, #667eea 100%)'">
                            <div style="flex-grow: 1;">
                                <h6 style="color: #fff; font-weight: 700; font-size: 1.3rem; margin-bottom: 15px;">🎮 ${seuPersonagem.personagem.nome}</h6>
                                <div style="font-size: 1.05rem; color: #e0e0e0; line-height: 1.6;">
                                    <div><strong style="color: #667eea; font-size: 0.9rem; text-transform: uppercase;">Raça:</strong> ${seuPersonagem.personagem.raca || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.9rem; text-transform: uppercase;">Idade:</strong> ${seuPersonagem.personagem.idade || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.9rem; text-transform: uppercase;">Nível:</strong> ${seuPersonagem.personagem.nivel || 0}</div>
                                    <div style="display: flex; flex-direction: column;">
                                        <div><strong style="color: #667eea; font-size: 0.9rem; text-transform: uppercase;">Altura:</strong> ${seuPersonagem.personagem.altura || '-'}</div>
                                        <div><strong style="color: #667eea; font-size: 0.9rem; text-transform: uppercase;">Peso:</strong> ${seuPersonagem.personagem.peso || '-'}</div>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-primary w-100 mt-3" onclick="viewPersonagem('${seuPersonagem.personagem.id}')" style="background: #667eea; border: none; padding: 10px; font-weight: 600;">👁️ Ver Ficha Completa</button>
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
                    <div class="card custom-glass-card mb-4">
                        <div class="card-header custom-card-header">
                            <h6 class="card-title mb-0" style="color: #fff; font-weight: 700; font-size: 1.05rem;">🎮 ${p.personagem.nome}</h6>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; gap: 15px; align-items: flex-start;">
                                <img src="${p.personagem.foto_url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="" class="zoomable-image photo-player-others" style="border-radius: 50%; object-fit: cover; ${!p.personagem.foto_url ? 'background: linear-gradient(135deg, #1a2a4e 0%, #667eea 100%);' : ''}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; this.style.background='linear-gradient(135deg, #1a2a4e 0%, #667eea 100%)'">
                                <div style="flex-grow: 1; font-size: 0.95rem; color: #e0e0e0; line-height: 1.4;">
                                    <div><strong style="color: #667eea; font-size: 0.8rem; text-transform: uppercase;">Raça:</strong> ${p.personagem.raca || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.8rem; text-transform: uppercase;">Idade:</strong> ${p.personagem.idade || '-'}</div>
                                    <div><strong style="color: #667eea; font-size: 0.8rem; text-transform: uppercase;">Nível:</strong> ${p.personagem.nivel || 0}</div>
                                    <div style="display: flex; flex-direction: column;">
                                        <div><strong style="color: #667eea; font-size: 0.8rem; text-transform: uppercase;">Altura:</strong> ${p.personagem.altura || '-'}</div>
                                        <div><strong style="color: #667eea; font-size: 0.8rem; text-transform: uppercase;">Peso:</strong> ${p.personagem.peso || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer custom-card-footer border-0">
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
