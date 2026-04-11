/**
 * Sistema de Calendário para Campanhas
 * Gerencia o contador de dias e observações diárias.
 */

let currentCampanhaData = null;

/**
 * Inicializa o calendário com os dados da campanha
 * @param {Object} campanha - Objeto da campanha vindo do Supabase
 */
async function inicializarCalendario(campanha) {
    if (!campanha) return;
    currentCampanhaData = campanha;

    // Garantir que os campos existam (fallback)
    if (currentCampanhaData.dia_atual === undefined) currentCampanhaData.dia_atual = 1;
    if (currentCampanhaData.calendario_obs === undefined) currentCampanhaData.calendario_obs = {};

    atualizarInterfaceCalendario();
}

/**
 * Atualiza a UI com os dados atuais
 */
function atualizarInterfaceCalendario() {
    const diaDisplay = document.getElementById('diaAtualDisplay');
    const diaObsInput = document.getElementById('diaObs');
    const diaObsDisplay = document.getElementById('diaObsDisplay');

    if (diaDisplay) {
        diaDisplay.textContent = `Dia ${currentCampanhaData.dia_atual}`;
    }

    const obsHoje = currentCampanhaData.calendario_obs[currentCampanhaData.dia_atual] || '';

    if (diaObsInput) {
        diaObsInput.value = obsHoje;
    }

    if (diaObsDisplay) {
        if (obsHoje) {
            diaObsDisplay.innerHTML = obsHoje.replace(/\n/g, '<br>');
        } else {
            diaObsDisplay.innerHTML = '<em>Nenhuma observação para hoje.</em>';
        }
    }
}

/**
 * Altera o dia atual (Narrador apenas)
 * @param {number} delta - Quantidade de dias para somar/subtrair
 */
async function alterarDia(delta) {
    if (!currentCampanhaData || !campanhaId) return;

    const novoDia = Math.max(1, currentCampanhaData.dia_atual + delta);
    if (novoDia === currentCampanhaData.dia_atual) return;

    try {
        const { error } = await supabase
            .from('campanhas')
            .update({ dia_atual: novoDia })
            .eq('id', campanhaId);

        if (error) throw error;

        currentCampanhaData.dia_atual = novoDia;
        atualizarInterfaceCalendario();
        console.log(`✅ Dia atualizado para ${novoDia}`);
    } catch (error) {
        console.error('Erro ao atualizar dia:', error.message);
        alert('Erro ao atualizar dia da campanha.');
    }
}

/**
 * Salva a observação do dia atual (Narrador apenas)
 */
async function salvarObservacaoDia() {
    if (!currentCampanhaData || !campanhaId) return;

    const diaObsInput = document.getElementById('diaObs');
    if (!diaObsInput) return;

    const novaObs = diaObsInput.value.trim();
    const diaAtual = currentCampanhaData.dia_atual;

    // Criar cópia profunda do objeto de observações
    const novasObs = { ...currentCampanhaData.calendario_obs };

    if (novaObs) {
        novasObs[diaAtual] = novaObs;
    } else {
        delete novasObs[diaAtual];
    }

    try {
        const { error } = await supabase
            .from('campanhas')
            .update({ calendario_obs: novasObs })
            .eq('id', campanhaId);

        if (error) throw error;

        currentCampanhaData.calendario_obs = novasObs;
        atualizarInterfaceCalendario();
        alert('✅ Observação salva com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar observação:', error.message);
        alert('Erro ao salvar observação.');
    }
}

/**
 * Escuta atualizações em tempo real (para jogadores)
 */
function assinarAtualizacoesCalendario() {
    if (!window.supabase || !campanhaId) return;

    supabase
        .channel(`public:campanhas:id=eq.${campanhaId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'campanhas',
            filter: `id=eq.${campanhaId}`
        }, payload => {
            const data = payload.new;
            if (data) {
                currentCampanhaData.dia_atual = data.dia_atual;
                currentCampanhaData.calendario_obs = data.calendario_obs || {};
                atualizarInterfaceCalendario();
            }
        })
        .subscribe();
}
