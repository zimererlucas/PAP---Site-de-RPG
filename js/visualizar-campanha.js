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
    if (!campanhaId) return;

    console.log('🎯 [DEBUG] Passando turno da campanha:', campanhaId);

    // Enviar para servidor sem esperar (fire-and-forget)
    passarTurnoCampanha(campanhaId).then(resultado => {
        console.log('🎯 [DEBUG] Resultado passarTurnoCampanha:', resultado);
        if (resultado.success) {
            console.log('✅', resultado.mensagem);
            // Recarregar personagens após processar turnos (background)
            loadPersonagens().catch(console.error);
            // Disparar evento cross-aba para forçar reload das fichas abertas
            localStorage.setItem('turno-passado', `${campanhaId}-${Date.now()}`);
        } else {
            console.error('❌ Erro ao passar turno:', resultado.error);
        }
    }).catch(erro => {
        console.error('🎯 [DEBUG] Erro CATCH ao passar turno:', erro);
    });
}

function resetarTurnosUI() {
    if (!campanhaId) return;

    // Enviar para servidor sem esperar (fire-and-forget)
    resetarTurnosCampanha(campanhaId).then(resultado => {
        if (resultado.success) {
            console.log('✅', resultado.mensagem);
            // Recarregar personagens após resetar turnos (background)
            loadPersonagens().catch(console.error);
            // Disparar evento cross-aba para forçar reload das fichas abertas
            localStorage.setItem('turno-passado', `${campanhaId}-${Date.now()}`);
        } else {
            console.error('❌ Erro ao resetar turnos:', resultado.error);
        }
    }).catch(erro => {
        console.error('Erro ao resetar turnos:', erro);
    });
}

async function atualizarExibicaoTurnos(campanha) {
    const turnosControl = document.getElementById('turnosControl');
    const usuarioAtual = await getCurrentUser();

    // Mostrar controle de turnos apenas se for o narrador
    if (usuarioAtual && campanha.narrador_id === usuarioAtual.id) {
        turnosControl.style.display = 'block';
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

function getIniciativaStateKey() {
    return campanhaId ? `campanha-iniciativa-state-${campanhaId}` : null;
}

function carregarIniciativa() {
    const key = getIniciativaKey();
    if (!key) return;
    try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        renderIniciativa(Array.isArray(data) ? data : []);
        atualizarDisplayTurno();
    } catch (err) {
        console.error('Erro ao carregar iniciativa:', err);
        renderIniciativa([]);
        atualizarDisplayTurno();
    }
}

function salvarIniciativa(lista) {
    const key = getIniciativaKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(lista));
}

function getIniciativaState() {
    const key = getIniciativaStateKey();
    if (!key) return { turnoAtual: 1, rodadaAtual: 1 };
    try {
        const state = JSON.parse(localStorage.getItem(key) || '{"turnoAtual":1,"rodadaAtual":1}');
        return state;
    } catch (_) {
        return { turnoAtual: 1, rodadaAtual: 1 };
    }
}

function salvarIniciativaState(state) {
    const key = getIniciativaStateKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(state));
}

function atualizarDisplayTurno() {
    const state = getIniciativaState();
    const key = getIniciativaKey();
    let total = 0;
    try {
        const lista = JSON.parse(localStorage.getItem(key) || '[]');
        total = Array.isArray(lista) ? lista.length : 0;
    } catch (_) {
        total = 0;
    }

    const rodadaDisplay = document.getElementById('rodadaAtualDisplay');
    const turnoDisplay = document.getElementById('turnoAtualDisplay');
    const turnoInfo = document.getElementById('turnoInfoDisplay');
    
    if (rodadaDisplay) rodadaDisplay.textContent = state.rodadaAtual;
    if (turnoDisplay) turnoDisplay.textContent = `${state.turnoAtual} / ${total}`;
    if (turnoInfo) turnoInfo.textContent = `${state.turnoAtual} / ${total}`;
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
        atualizarDisplayTurno();
        return;
    }

    const state = getIniciativaState();

    lista.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Destacar turno atual
        if (state.turnoAtual === index + 1) {
            row.style.backgroundColor = 'rgba(25, 135, 84, 0.2)';
        }

        const numero = document.createElement('td');
        numero.textContent = item.ordem != null ? item.ordem : (index + 1);
        numero.style.fontWeight = state.turnoAtual === index + 1 ? 'bold' : 'normal';
        row.appendChild(numero);

        const nome = document.createElement('td');
        nome.textContent = item.nome || '-';
        nome.style.fontWeight = state.turnoAtual === index + 1 ? 'bold' : 'normal';
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

    atualizarDisplayTurno();
}

function adicionarIniciativa() {
    const ordemInput = document.getElementById('iniciativaOrdem');
    const nomeInput = document.getElementById('iniciativaNome');
    const obsInput = document.getElementById('iniciativaObs');
    if (!nomeInput || !obsInput) return;

    const nome = nomeInput.value.trim();
    const obs = obsInput.value.trim();
    const ordemValor = ordemInput ? parseInt(ordemInput.value, 10) : NaN;

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

    lista.push({ ordem: isNaN(ordemValor) ? null : ordemValor, nome, obs });

    // ordenar por ordem crescente, mantendo sem ordem no fim
    lista = lista.sort((a, b) => {
        if (a.ordem == null && b.ordem == null) return 0;
        if (a.ordem == null) return 1;
        if (b.ordem == null) return -1;
        return a.ordem - b.ordem;
    });

    salvarIniciativa(lista);
    renderIniciativa(lista);

    if (ordemInput) ordemInput.value = '';
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
    
    // Ajustar turno atual se necessário
    const state = getIniciativaState();
    if (state.turnoAtual > lista.length && lista.length > 0) {
        state.turnoAtual = lista.length;
        salvarIniciativaState(state);
    } else if (lista.length === 0) {
        state.turnoAtual = 1;
        state.rodadaAtual = 1;
        salvarIniciativaState(state);
    }
    
    salvarIniciativa(lista);
    renderIniciativa(lista);
}

function avancarTurnoIniciativa() {
    const key = getIniciativaKey();
    if (!key) return;

    let lista = [];
    try {
        lista = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(lista)) lista = [];
    } catch (_) {
        lista = [];
    }

    if (lista.length === 0) {
        alert('Adicione personagens à iniciativa primeiro.');
        return;
    }

    const state = getIniciativaState();
    
    // Incrementar turno
    state.turnoAtual++;
    
    // Se turno ultrapassar o número de pessoas, resetar turno e incrementar rodada
    if (state.turnoAtual > lista.length) {
        state.turnoAtual = 1;
        state.rodadaAtual++;
        
        // Passar turno da campanha automaticamente (reduz durações)
        if (campanhaId) {
            passarTurnoUI();
        }
    }
    
    salvarIniciativaState(state);
    renderIniciativa(lista);
}

function resetarIniciativa() {
    const confirmed = confirm('Resetar iniciativa? Isso voltará para Rodada 1, Turno 1.');
    if (!confirmed) return;
    
    const state = { turnoAtual: 1, rodadaAtual: 1 };
    salvarIniciativaState(state);
    
    const key = getIniciativaKey();
    if (!key) return;
    
    let lista = [];
    try {
        lista = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(lista)) lista = [];
    } catch (_) {
        lista = [];
    }
    
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