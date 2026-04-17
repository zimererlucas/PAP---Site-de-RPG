// Página de Campanhas - Listagem

let campanhasNarradorTodas = [];
let campanhasJogadorTodas = [];

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;

    // Carregar campanhas como narrador
    await loadCampanhasNarrador();

    // Carregar campanhas como jogador
    await loadCampanhasJogador();

    // Setup event listeners
    setupEventListeners();
    setupSearchListeners();
});

function setupEventListeners() {
    const form = document.getElementById('entrarCampanhaForm');
    if (form) {
        form.addEventListener('submit', handleEntrarCampanha);
    }
}

function setupSearchListeners() {
    const inputNarrador = document.getElementById('campanhaNarradorSearchInput');
    if (inputNarrador) {
        inputNarrador.addEventListener('input', function () {
            const termo = this.value.trim().toLowerCase();
            if (!termo) {
                renderCampanhasNarrador(campanhasNarradorTodas);
                return;
            }
            const filtradas = campanhasNarradorTodas.filter(c =>
                (c.nome || '').toLowerCase().includes(termo)
            );
            renderCampanhasNarrador(filtradas);
        });
    }

    const inputJogador = document.getElementById('campanhaJogadorSearchInput');
    if (inputJogador) {
        inputJogador.addEventListener('input', function () {
            const termo = this.value.trim().toLowerCase();
            if (!termo) {
                renderCampanhasJogador(campanhasJogadorTodas);
                return;
            }
            const filtradas = campanhasJogadorTodas.filter(p =>
                (p.campanha?.nome || '').toLowerCase().includes(termo)
            );
            renderCampanhasJogador(filtradas);
        });
    }
}

async function loadCampanhasNarrador() {
    const loadingState = document.getElementById('loadingNarrador');
    const emptyState = document.getElementById('emptyNarrador');
    const container = document.getElementById('campanhasNarradorContainer');

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite esgotado. Verifica a tua ligação à internet.')), 15000)
        );
        const result = await Promise.race([getCampanhasDoUsuario(), timeoutPromise]);

        if (!result.success) {
            console.error('Erro ao carregar campanhas:', result.error);
            if (loadingState) loadingState.innerHTML = `
                <div style="color:#ff8080; padding:20px; text-align:center;">
                    <div style="font-size:2em;">⚠️</div>
                    <strong>Erro ao carregar campanhas</strong>
                    <p style="font-size:0.9em; margin:8px 0;">${result.error || 'Erro desconhecido'}</p>
                    <button onclick="loadCampanhasNarrador()" style="padding:8px 20px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">🔄 Tentar novamente</button>
                </div>`;
            return;
        }

        const campanhas = result.data || [];
        if (loadingState) loadingState.style.display = 'none';

        if (campanhas.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        campanhasNarradorTodas = campanhas;

        // Renderizar campanhas
        renderCampanhasNarrador(campanhas);
        updateProgressCampanhas();

    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        if (loadingState) loadingState.innerHTML = `
            <div style="color:#ff8080; padding:20px; text-align:center;">
                <div style="font-size:2em;">⚠️</div>
                <strong>Erro ao carregar campanhas</strong>
                <p style="font-size:0.9em; margin:8px 0;">${error.message || 'Erro inesperado'}</p>
                <button onclick="loadCampanhasNarrador()" style="padding:8px 20px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">🔄 Tentar novamente</button>
            </div>`;
    }
}

async function loadCampanhasJogador() {
    const loadingState = document.getElementById('loadingJogador');
    const emptyState = document.getElementById('emptyJogador');
    const container = document.getElementById('campanhasJogadorContainer');
    const btnBottom = document.getElementById('btnEntrarBottom');

    try {
        const user = await getCurrentUser();
        if (!user) return;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite esgotado. Verifica a tua ligação à internet.')), 15000)
        );

        const queryPromise = supabase
            .from('campanha_personagens')
            .select(`
                *,
                campanha:campanha_id(id, nome, descricao, codigo, narrador_id, ativa),
                personagem:personagem_id(id, nome, raca)
            `)
            .eq('jogador_id', user.id);

        const { data, error } = await Promise.race([queryPromise, timeoutPromise.then(() => { throw new Error('Tempo limite esgotado.'); })]);

        // Sempre remover o loading primeiro
        if (loadingState) loadingState.style.display = 'none';

        if (error) {
            console.error(error);
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        const participacoes = data || [];

        // limpar UI base
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'none';

        // Caso não tenha campanhas
        if (participacoes.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        campanhasJogadorTodas = participacoes;

        // Renderizar campanhas
        renderCampanhasJogador(participacoes);

        // mostrar botão inferior
        if (btnBottom) btnBottom.style.display = 'block';

    } catch (e) {
        console.error(e);
        if (loadingState) loadingState.innerHTML = `
            <div style="color:#ff8080; padding:20px; text-align:center;">
                <div style="font-size:2em;">⚠️</div>
                <strong>Erro ao carregar campanhas</strong>
                <p style="font-size:0.9em; margin:8px 0;">${e.message || 'Erro inesperado'}</p>
                <button onclick="loadCampanhasJogador()" style="padding:8px 20px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">🔄 Tentar novamente</button>
            </div>`;
    }
}

function renderCampanhasNarrador(lista) {
    const container = document.getElementById('campanhasNarradorContainer');
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-4">
                Nenhuma campanha encontrada para essa pesquisa.
            </div>
        `;
        return;
    }

    container.innerHTML = lista.map(campanha => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 custom-glass-card">
                <div class="card-header custom-card-header">
                    <h5 class="card-title mb-0" style="color: #667eea; font-weight: 700; font-size: 1.25rem;">🎭 ${campanha.nome}</h5>
                </div>
                <div class="card-body">
                    <p class="card-text text-standard-upsized">${campanha.descricao || 'Sem descrição'}</p>
                    <p style="font-size: 0.95rem; margin-bottom: 8px;">
                        <strong style="color: #667eea;">Código:</strong> <code class="text-e0e0e0" style="background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${campanha.codigo}</code>
                    </p>
                    <p style="font-size: 0.95rem;">
                        <strong style="color: #667eea;">Status:</strong> <span class="text-e0e0e0">${campanha.ativa ? '✅ Ativa' : '❌ Inativa'}</span>
                    </p>
                </div>
                <div class="card-footer custom-card-footer">
                    <button class="btn btn-sm" style="background-color: #667eea; border-color: #667eea; color: white; padding: 6px 12px; font-weight: 600;" onclick="viewCampanha('${campanha.id}')">Visualizar</button>
                    <button class="btn btn-sm btn-warning" style="padding: 6px 12px; font-weight: 600;" onclick="editCampanha('${campanha.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" style="padding: 6px 12px; font-weight: 600;" onclick="deleteCampanhaUI('${campanha.id}')">Deletar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCampanhasJogador(lista) {
    const container = document.getElementById('campanhasJogadorContainer');
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-4">
                Nenhuma campanha encontrada para essa pesquisa.
            </div>
        `;
        return;
    }

    container.innerHTML = lista.map(p => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 custom-glass-card">
                <div class="card-header custom-card-header">
                    <h5 class="card-title mb-0" style="color: #667eea; font-weight: 700; font-size: 1.25rem;">🎭 ${p.campanha.nome}</h5>
                </div>
                <div class="card-body">
                    <p class="card-text text-standard-upsized">${p.campanha.descricao || 'Sem descrição'}</p>
                    <p style="font-size: 0.95rem; margin-bottom: 8px;">
                        <strong style="color: #667eea;">Seu Personagem:</strong> <span class="text-e0e0e0">${p.personagem.nome}</span>
                    </p>
                    <p style="font-size: 0.95rem;">
                        <strong style="color: #667eea;">Status:</strong> <span class="text-e0e0e0">${p.campanha.ativa ? '✅ Ativa' : '❌ Inativa'}</span>
                    </p>
                </div>
                <div class="card-footer custom-card-footer">
                    <button class="btn btn-sm" style="background-color: #667eea; border-color: #667eea; color: white; padding: 6px 15px; font-weight: 600;" onclick="viewCampanhaJogador('${p.campanha.id}')">Visualizar</button>
                    <button class="btn btn-sm btn-danger" style="padding: 6px 15px; font-weight: 600;" onclick="sairDaCampanha('${p.id}')">Sair</button>
                </div>
            </div>
        </div>
    `).join('');
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

function tentarCriarCampanha() {
    const isAdmin = window.currentUserProfile && window.currentUserProfile.is_admin;

    if (!isAdmin && campanhasNarradorTodas && campanhasNarradorTodas.length >= 3) {
        alert('Limite atingido: você só pode criar até 3 campanhas como narrador. Como administrador os limites não se aplicam.');
        return;
    }
    window.location.href = 'criar-campanha.html';
}

function updateProgressCampanhas() {
    const container = document.getElementById('campanhas-progress-container');
    const text = document.getElementById('campanhas-progress-text');
    const bar = document.getElementById('campanhas-progress-bar');
    if (!container || !text || !bar) return;

    container.style.display = 'block';

    // Verifica cargo de administrador injetado por auth.js
    const isAdmin = window.currentUserProfile && window.currentUserProfile.is_admin;
    const maxCampanhas = 3;
    const current = campanhasNarradorTodas.length;

    if (isAdmin) {
        text.textContent = `Campanhas: ${current} / ∞ (Administrador)`;
        bar.style.width = '100%';
        bar.style.backgroundColor = '#10b981'; // Verde indicando privilégio admin
    } else {
        text.textContent = `Campanhas: ${current} / ${maxCampanhas}`;
        const pct = Math.min((current / maxCampanhas) * 100, 100);
        bar.style.width = `${pct}%`;

        if (current >= maxCampanhas) {
            bar.style.backgroundColor = '#ef4444'; // Vermelho lotado
            text.style.color = '#ef4444';
        } else {
            bar.style.backgroundColor = '#667eea';
            text.style.color = '#667eea';
        }
    }
}

function editCampanha(id) {
    window.location.href = `criar-campanha.html?id=${id}`;
}

async function deleteCampanhaConfirm(id) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja deletar esta campanha?');
    if (!confirmed) return;

    const result = await deleteCampanha(id);

    if (result.success) {
        await loadCampanhasNarrador();
    } else {
        console.error('Erro ao deletar campanha:', result.error);
    }
}

async function sairDaCampanha(participacaoId) {
    const confirmed = await showConfirmDialog('Tem certeza que deseja sair desta campanha?');
    if (!confirmed) return;

    const result = await removerJogadorDaCampanha(participacaoId);

    if (result.success) {
        await loadCampanhasJogador();
    } else {
        console.error('Erro ao sair da campanha:', result.error);
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
        console.warn('Por favor, preencha todos os campos!');
        return;
    }

    // Obter campanha pelo código
    const campanhaResult = await getCampanhaByCodigo(codigo);

    if (!campanhaResult.success) {
        console.warn('Campanha não encontrada! Verifique o código.');
        return;
    }

    const campanha = campanhaResult.data;

    // Adicionar jogador à campanha
    const result = await adicionarJogadorACampanha(campanha.id, personagemId);

    if (result.success) {
        document.getElementById('entrarCampanhaForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('entrarCampanhaModal')).hide();
        await loadCampanhasJogador();
    } else {
        console.error('Erro ao entrar na campanha:', result.error);
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
