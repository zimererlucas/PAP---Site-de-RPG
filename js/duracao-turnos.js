// ============================================
// SISTEMA AUTOMÁTICO DE DURAÇÃO EM TURNOS
// ============================================

/**
 * Ativa uma habilidade com duração em turnos
 * @param {string} fichaId - ID do personagem
 * @param {string} habilidadeId - ID da habilidade
 * @param {number} duracaoTurnos - Número de turnos que a habilidade durará
 */
async function ativarHabilidadeComDuracao(fichaId, habilidadeId, duracaoTurnos = 1) {
    try {
        const { data: hab, error: erroHab } = await supabase
            .from('habilidades')
            .select('*')
            .eq('id', habilidadeId)
            .single();

        if (erroHab) throw erroHab;

        // Obter dados do personagem
        const { data: personagem, error: erroPersonagem } = await supabase
            .from('personagens')
            .select('mana_atual, estamina_atual')
            .eq('id', fichaId)
            .single();

        if (erroPersonagem) throw erroPersonagem;

        // Verificar recursos
        const manaSuficiente = personagem.mana_atual >= (hab.custo_mana || 0);
        const estaminaSuficiente = personagem.estamina_atual >= (hab.custo_estamina || 0);

        if (!manaSuficiente || !estaminaSuficiente) {
            return {
                success: false,
                error: 'Recursos insuficientes',
                detalhe: `Mana: ${personagem.mana_atual}/${hab.custo_mana || 0} | Estamina: ${personagem.estamina_atual}/${hab.custo_estamina || 0}`
            };
        }

        // Ativar habilidade com duração
        const { error: erroAtualizar } = await supabase
            .from('habilidades')
            .update({
                ativa: true,
                ativada_em: new Date().toISOString(),
                duracao_turnos: duracaoTurnos,
                turnos_restantes: duracaoTurnos
            })
            .eq('id', habilidadeId);

        if (erroAtualizar) throw erroAtualizar;

        // Descontar recursos
        const novaMana = personagem.mana_atual - (hab.custo_mana || 0);
        const novaEstamina = personagem.estamina_atual - (hab.custo_estamina || 0);

        const { error: erroGasto } = await supabase
            .from('personagens')
            .update({
                mana_atual: novaMana,
                estamina_atual: novaEstamina
            })
            .eq('id', fichaId);

        if (erroGasto) throw erroGasto;

        return {
            success: true,
            mensagem: `✅ ${hab.nome} ativada por ${duracaoTurnos} turno(s)!`,
            duracao: duracaoTurnos
        };

    } catch (error) {
        console.error('Erro ao ativar habilidade com duração:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Avança automaticamente um turno e desativa habilidades que expiraram
 * @param {string} fichaId - ID do personagem
 */
async function avancarTurno(fichaId) {
    try {
        // 1. Obter todas as habilidades ativas com duração
        const { data: habilidades, error: erroHabilidades } = await supabase
            .from('habilidades')
            .select('*')
            .eq('personagem_id', fichaId)
            .eq('ativa', true);

        if (erroHabilidades) throw erroHabilidades;

        let desativadas = 0;
        const atualizacoes = [];

        // 2. Processar cada habilidade ativa
        for (const hab of habilidades) {
            if (hab.turnos_restantes && hab.turnos_restantes > 0) {
                const novosTurnos = hab.turnos_restantes - 1;
                const agora = new Date().toISOString();

                atualizacoes.push({
                    id: hab.id,
                    turnos_restantes: novosTurnos,
                    ativa: novosTurnos > 0,
                    deativada_em: novosTurnos === 0 ? agora : null
                });

                if (novosTurnos === 0) desativadas++;
            }
        }

        // 3. Aplicar todas as atualizações
        for (const atualiz of atualizacoes) {
            const { error } = await supabase
                .from('habilidades')
                .update({
                    turnos_restantes: atualiz.turnos_restantes,
                    ativa: atualiz.ativa,
                    deativada_em: atualiz.deativada_em
                })
                .eq('id', atualiz.id);

            if (error) throw error;
        }

        // 4. Recalcular bônus globais após atualizar habilidades
        await recalcularBonusGlobais(fichaId);

        return {
            success: true,
            mensagem: `✅ Turno avançado! ${desativadas} habilidade(s) expirada(s).`,
            habilidadesDesativadas: desativadas,
            habilidadesProcessadas: habilidades.length
        };

    } catch (error) {
        console.error('Erro ao avançar turno:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Obtém o status de duração de todas as habilidades ativas
 * @param {string} fichaId - ID do personagem
 */
async function obterStatusDuracoes(fichaId) {
    try {
        const { data: habilidades, error } = await supabase
            .from('habilidades')
            .select('id, nome, ativa, turnos_restantes, duracao_turnos')
            .eq('personagem_id', fichaId)
            .eq('ativa', true);

        if (error) throw error;

        return {
            success: true,
            data: habilidades.map(hab => ({
                id: hab.id,
                nome: hab.nome,
                turnos_restantes: hab.turnos_restantes || 0,
                duracao_total: hab.duracao_turnos || 0,
                percentual: hab.duracao_turnos ? Math.round((hab.turnos_restantes / hab.duracao_turnos) * 100) : 0
            }))
        };

    } catch (error) {
        console.error('Erro ao obter status de durações:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Renderiza a barra de progressão de duração de uma habilidade
 */
function renderizarBarraDuracao(habilidade) {
    if (!habilidade.turnos_restantes || !habilidade.duracao_turnos) {
        return '';
    }

    const percentual = (habilidade.turnos_restantes / habilidade.duracao_turnos) * 100;
    const cor = percentual > 50 ? '#51cf66' : percentual > 25 ? '#ffd700' : '#ff6b6b';

    return `
        <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #e0e0e0; margin-bottom: 4px;">
                <span>Duração:</span>
                <span>${habilidade.turnos_restantes}/${habilidade.duracao_turnos} turnos</span>
            </div>
            <div style="width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                <div style="
                    width: ${percentual}%;
                    height: 100%;
                    background: ${cor};
                    transition: width 0.3s ease;
                    border-radius: 4px;
                "></div>
            </div>
        </div>
    `;
}

/**
 * Renderiza botão de "Passar Turno" para combate
 */
function renderizarBotaoPassarTurno() {
    return `
        <button onclick="executarPassarTurno()" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: 2px solid #667eea;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin-top: 10px;
        ">
            ⏭️ Passar Turno
        </button>
    `;
}

/**
 * Executa o comando de passar turno (vinculado ao botão UI)
 */
async function executarPassarTurno() {
    const fichaId = window.fichaIdGlobal;
    if (!fichaId) {
        console.error('Erro: fichaIdGlobal não definido');
        return;
    }

    console.log('⏳ Passando turno...');
    const resultado = await avancarTurno(fichaId);

    if (resultado.success) {
        console.log('✅', resultado.mensagem);
        
        // Recarregar habilidades e ficha
        if (typeof carregarHabilidades === 'function') {
            await carregarHabilidades();
        }
        if (typeof loadFicha === 'function') {
            await loadFicha();
        }
    } else {
        console.error('❌ Erro ao passar turno:', resultado.error);
    }
}

/**
 * Monitora e exibe alertas quando habilidades estão prestes a expirar
 * @param {string} fichaId - ID do personagem
 */
async function monitorarDuracoes(fichaId) {
    try {
        const status = await obterStatusDuracoes(fichaId);
        
        if (!status.success) return;

        for (const hab of status.data) {
            // Aviso quando falta 1 turno
            if (hab.turnos_restantes === 1) {
                console.warn(`⚠️ ${hab.nome} expirará no próximo turno!`);
            }
            // Aviso quando expira
            else if (hab.turnos_restantes === 0) {
                console.log(`❌ ${hab.nome} expirou!`);
            }
        }

    } catch (error) {
        console.error('Erro ao monitorar durações:', error.message);
    }
}
