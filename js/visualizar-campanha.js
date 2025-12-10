// Página de Visualizar Campanha (Narrador)

let campanhaId = null;
let campanhaDiceChannel = null;
const CAMPANHA_DICE_HISTORY_MAX = 100;

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;

    // Obter ID da campanha da URL
    const params = new URLSearchParams(window.location.search);
    campanhaId = params.get('id');

    // Sinaliza campanha ativa para broadcast das fichas
    if (campanhaId) localStorage.setItem('campanha-atual', campanhaId);

    if (!campanhaId) {
        console.error('Campanha não encontrada!');
        window.location.href = 'campanhas.html';
        return;
    }

    // Carregar campanha e personagens
    await loadCampanha();

    // Iniciar histórico de dados da campanha
    iniciarHistoricoDadosCampanha();
});

window.addEventListener('beforeunload', () => {
    if (campanhaId) localStorage.removeItem('campanha-atual');
    if (campanhaDiceChannel) campanhaDiceChannel.unsubscribe();
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

        // Atualizar exibição de turnos
        await atualizarExibicaoTurnos(campanha);

        // Carregar personagens
        await loadPersonagens();

        // Carregar iniciativas locais
        carregarIniciativa();

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
                    <p class="card-text" style="color: #e0e0e0;">
                        <strong style="color: #e0e0e0;">Raça:</strong> ${p.personagem.raca || '-'}<br>
                        <strong style="color: #e0e0e0;">Nível:</strong> ${p.personagem.nivel || 0}<br>
                        <strong style="color: #e0e0e0;">Vida:</strong> ${p.personagem.vida_atual || 0} / ${p.personagem.vida_maxima || 0}<br>
                        <strong style="color: #e0e0e0;">Estamina:</strong> ${p.personagem.estamina_atual || 0} / ${p.personagem.estamina_maxima || 0}<br>
                        <strong style="color: #e0e0e0;">Jogador:</strong> ${p.jogador.username || 'Usuário'}
                        </p>
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

// ============================================
// SISTEMA DE TURNOS
// ============================================

function passarTurnoUI() {
    const botao = document.getElementById('botaoPassarTurno');
    botao.disabled = true;
    botao.textContent = '⏳ Processando...';

    // Incrementar o turno localmente imediatamente
    let turnoAtual = parseInt(document.getElementById('turnoAtualDisplay').textContent) || 0;
    turnoAtual++;
    document.getElementById('turnoAtualDisplay').textContent = turnoAtual;

    // Enviar para servidor sem esperar (fire-and-forget)
    passarTurnoCampanha(campanhaId).then(resultado => {
        if (resultado.success) {
            console.log('✅', resultado.mensagem);
            // Recarregar personagens após processar turnos (background)
            loadPersonagens().catch(console.error);
            // Disparar evento cross-aba para forçar reload das fichas abertas
            localStorage.setItem('turno-passado', `${campanhaId}-${Date.now()}`);
        } else {
            alert('❌ Erro: ' + resultado.error);
            // Reverter turno em caso de erro
            turnoAtual--;
            document.getElementById('turnoAtualDisplay').textContent = turnoAtual;
        }
    }).catch(erro => {
        console.error('Erro ao passar turno:', erro);
        alert('Erro ao passar turno: ' + erro.message);
        // Reverter turno em caso de erro
        turnoAtual--;
        document.getElementById('turnoAtualDisplay').textContent = turnoAtual;
    }).finally(() => {
        botao.disabled = false;
        botao.textContent = '⏭️ Passar';
    });
}

function resetarTurnosUI() {
    const botao = document.getElementById('botaoResetarTurnos');
    botao.disabled = true;
    botao.textContent = '🔄 Resetando...';

    // Resetar o turno localmente imediatamente
    document.getElementById('turnoAtualDisplay').textContent = '0';

    // Enviar para servidor sem esperar (fire-and-forget)
    resetarTurnosCampanha(campanhaId).then(resultado => {
        if (resultado.success) {
            console.log('✅', resultado.mensagem);
            // Recarregar personagens após resetar turnos (background)
            loadPersonagens().catch(console.error);
            // Disparar evento cross-aba para forçar reload das fichas abertas
            localStorage.setItem('turno-passado', `${campanhaId}-${Date.now()}`);
        } else {
            alert('❌ Erro: ' + resultado.error);
        }
    }).catch(erro => {
        console.error('Erro ao resetar turnos:', erro);
        alert('Erro ao resetar turnos: ' + erro.message);
    }).finally(() => {
        botao.disabled = false;
        botao.textContent = '🔄 Resetar';
    });
}

async function atualizarExibicaoTurnos(campanha) {
    const turnosControl = document.getElementById('turnosControl');
    const usuarioAtual = await getCurrentUser();

    // Mostrar controle de turnos apenas se for o narrador
    if (usuarioAtual && campanha.narrador_id === usuarioAtual.id) {
        turnosControl.style.display = 'block';
        document.getElementById('turnoAtualDisplay').textContent = campanha.turno_atual || 0;
    } else {
        turnosControl.style.display = 'none';
    }
}

// ============================================
// INICIATIVA (LOCAL NA PÁGINA)
// ============================================

function getIniciativaKey() {
    return campanhaId ? `campanha-iniciativa-${campanhaId}` : null;
}

function carregarIniciativa() {
    const key = getIniciativaKey();
    if (!key) return;
    try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        renderIniciativa(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error('Erro ao carregar iniciativa:', err);
        renderIniciativa([]);
    }
}

function salvarIniciativa(lista) {
    const key = getIniciativaKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(lista));
}

function renderIniciativa(lista) {
    const tbody = document.getElementById('campanhaIniciativaBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.className = 'text-center text-muted';
        cell.textContent = 'Sem iniciativas.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    lista.forEach((item, index) => {
        const row = document.createElement('tr');

        const ordem = document.createElement('td');
        ordem.textContent = item.ordem ?? '-';
        row.appendChild(ordem);

        const nome = document.createElement('td');
        nome.textContent = item.nome || '-';
        row.appendChild(nome);

        const obs = document.createElement('td');
        obs.textContent = item.obs || '-';
        row.appendChild(obs);

        const actions = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-danger';
        btn.textContent = 'Remover';
        btn.onclick = () => removerIniciativa(index);
        actions.appendChild(btn);
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}

function adicionarIniciativa() {
    const ordemInput = document.getElementById('iniciativaOrdem');
    const nomeInput = document.getElementById('iniciativaNome');
    const obsInput = document.getElementById('iniciativaObs');
    if (!ordemInput || !nomeInput || !obsInput) return;

    const ordem = parseInt(ordemInput.value, 10);
    const nome = nomeInput.value.trim();
    const obs = obsInput.value.trim();

    if (!nome) {
        alert('Informe o personagem ou ação.');
        return;
    }

    let lista = [];
    try {
        const key = getIniciativaKey();
        lista = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(lista)) lista = [];
    } catch (_) {
        lista = [];
    }

    lista.push({ ordem: isNaN(ordem) ? null : ordem, nome, obs });

    // ordenar por ordem crescente, mantendo sem ordem no fim
    lista = lista.sort((a, b) => {
        if (a.ordem == null && b.ordem == null) return 0;
        if (a.ordem == null) return 1;
        if (b.ordem == null) return -1;
        return a.ordem - b.ordem;
    });

    salvarIniciativa(lista);
    renderIniciativa(lista);

    ordemInput.value = '';
    nomeInput.value = '';
    obsInput.value = '';
}

function removerIniciativa(index) {
    const key = getIniciativaKey();
    if (!key) return;

    let lista = [];
    try {
        lista = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(lista)) lista = [];
    } catch (_) {
        lista = [];
    }

    lista.splice(index, 1);
    salvarIniciativa(lista);
    renderIniciativa(lista);
}

// ============================================
// HISTÓRICO DE DADOS DA CAMPANHA (TEMPO REAL)
// ============================================

function getCampanhaHistoryKey() {
    return campanhaId ? `campanha-dice-history-${campanhaId}` : null;
}

function iniciarHistoricoDadosCampanha() {
    carregarHistoricoCampanha();
    if (!window.supabase || !campanhaId) return;

    campanhaDiceChannel = supabase.channel(`campanha-dados-${campanhaId}`)
        .on('broadcast', { event: 'dice-roll' }, (payload) => {
            const data = payload?.payload;
            if (!data) return;
            registrarHistoricoCampanha({
                timestamp: data.timestamp || Date.now(),
                personagem: data.personagem || data.jogador || 'Personagem',
                nome: data.nome || '-',
                tipo: data.tipo || '-',
                total: data.total,
                detalhes: data.detalhes || '-'
            });
        })
        .subscribe();
}

function carregarHistoricoCampanha() {
    const key = getCampanhaHistoryKey();
    if (!key) return;
    try {
        const historico = JSON.parse(localStorage.getItem(key) || '[]');
        renderHistoricoCampanha(Array.isArray(historico) ? historico : []);
    } catch (err) {
        console.error('Erro ao carregar histórico da campanha:', err);
        renderHistoricoCampanha([]);
    }
}

function registrarHistoricoCampanha(entry) {
    const key = getCampanhaHistoryKey();
    if (!key) return;

    let historico = [];
    try {
        historico = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(historico)) historico = [];
    } catch (_) {
        historico = [];
    }

    historico.unshift(entry);
    if (historico.length > CAMPANHA_DICE_HISTORY_MAX) {
        historico.length = CAMPANHA_DICE_HISTORY_MAX;
    }

    localStorage.setItem(key, JSON.stringify(historico));
    renderHistoricoCampanha(historico);
}

function renderHistoricoCampanha(historico) {
    const tbody = document.getElementById('campanhaDiceHistoryBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!historico || historico.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'text-center text-muted';
        cell.textContent = 'Sem rolagens ainda.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    historico.forEach((item) => {
        const row = document.createElement('tr');

        const hora = document.createElement('td');
        hora.textContent = new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour12: false });
        row.appendChild(hora);

        const personagem = document.createElement('td');
        personagem.textContent = item.personagem || 'Personagem';
        row.appendChild(personagem);

        const nome = document.createElement('td');
        nome.textContent = item.nome || '-';
        row.appendChild(nome);

        const total = document.createElement('td');
        total.textContent = item.total ?? '-';
        row.appendChild(total);

        const detalhes = document.createElement('td');
        detalhes.textContent = item.detalhes || '-';
        row.appendChild(detalhes);

        tbody.appendChild(row);
    });
}