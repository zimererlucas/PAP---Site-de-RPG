// ============================================
// SISTEMA DE TURNOS - UI COMPARTILHADA
// Usado tanto na visão do Narrador quanto na visão do Jogador
// Depende de:
//   - variável global campanhaId (definida em cada página)
//   - funções de backend em turnos-campanha.js (passarTurnoCampanha, resetarTurnosCampanha)
// ============================================

let campanhaDiceChannel = null;
const CAMPANHA_DICE_HISTORY_MAX = 100;

// ============================================
// CONTROLES DE TURNOS (BOTÕES / VISUAL)
// ============================================

function passarTurnoUI() {
    if (!campanhaId) return;

    console.log('🎯 [DEBUG] Passando turno da campanha:', campanhaId);

    // Enviar para servidor sem esperar (fire-and-forget)
    passarTurnoCampanha(campanhaId).then(resultado => {
        console.log('🎯 [DEBUG] Resultado passarTurnoCampanha:', resultado);
        if (resultado.success) {
            console.log('✅', resultado.mensagem);
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
            // Disparar evento cross-aba para forçar reload das fichas abertas
            localStorage.setItem('turno-passado', `${campanhaId}-${Date.now()}`);
        } else {
            console.error('❌ Erro ao resetar turnos:', resultado.error);
        }
    }).catch(erro => {
        console.error('Erro ao resetar turnos:', erro);
    });
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
        hora.style.color = '#e0e0e0';
        row.appendChild(hora);

        const personagem = document.createElement('td');
        personagem.textContent = item.personagem || 'Personagem';
        personagem.style.color = '#ffffff';
        personagem.style.fontWeight = 'bold';
        row.appendChild(personagem);

        const nome = document.createElement('td');
        nome.textContent = item.nome || '-';
        nome.style.color = '#e0e0e0';
        row.appendChild(nome);

        const total = document.createElement('td');
        total.textContent = item.total ?? '-';
        total.style.color = '#ffd700';
        total.style.fontWeight = 'bold';
        row.appendChild(total);

        const detalhes = document.createElement('td');
        detalhes.textContent = item.detalhes || '-';
        detalhes.style.color = '#aaaaaa';
        detalhes.style.fontSize = '0.9em';
        row.appendChild(detalhes);

        tbody.appendChild(row);
    });
}

