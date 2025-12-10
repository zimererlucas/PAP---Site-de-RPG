// ============================================
// SISTEMA DE TURNOS EM CAMPANHAS
// ============================================

/**
 * Passa 1 turno para TODA a campanha
 * @param {string} campanhaId - ID da campanha
 * @returns {Promise} Resultado da operação
 */
async function passarTurnoCampanha(campanhaId) {
    try {
        // 1. Obter dados da campanha
        const { data: campanha, error: erroCampanha } = await supabase
            .from('campanhas')
            .select('turno_atual, narrador_id')
            .eq('id', campanhaId)
            .single();

        if (erroCampanha) throw erroCampanha;

        // 2. Verificar se o usuário é o narrador da campanha
        const usuario = await getCurrentUser();
        if (!usuario || usuario.id !== campanha.narrador_id) {
            return {
                success: false,
                error: 'Apenas o narrador da campanha pode passar turnos'
            };
        }

        const novoTurno = (campanha.turno_atual || 0) + 1;

        // 3. Atualizar turno da campanha
        const { error: erroAtualizar } = await supabase
            .from('campanhas')
            .update({ turno_atual: novoTurno })
            .eq('id', campanhaId);

        if (erroAtualizar) throw erroAtualizar;

        // 4. Registrar no log de turnos
        const { error: erroLog } = await supabase
            .from('campanha_turnos')
            .insert([{
                campanha_id: campanhaId,
                numero_turno: novoTurno,
                passado_por: usuario.id
            }]);

        if (erroLog) throw erroLog;

        // 5. Buscar personagens da campanha através de campanha_personagens
        const { data: personagensCampanha, error: erroPersonagens } = await supabase
            .from('campanha_personagens')
            .select('personagem_id')
            .eq('campanha_id', campanhaId);

        if (erroPersonagens) throw erroPersonagens;

        // 6. Processar duração para TODOS os personagens
        let personagensProcessados = 0;
        if (personagensCampanha && personagensCampanha.length > 0) {
            for (const cp of personagensCampanha) {
                await processarDuracaoPersonagem(cp.personagem_id, novoTurno);
                personagensProcessados++;
            }
        }

        return {
            success: true,
            mensagem: `✅ Turno ${novoTurno} iniciado! Todos os personagens processados.`,
            turno_novo: novoTurno,
            personagens_processados: personagensProcessados
        };

    } catch (error) {
        console.error('Erro ao passar turno da campanha:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Processa a duração de habilidades, magias e itens para um personagem em um turno específico
 * @param {string} personagemId - ID do personagem
 * @param {number} turnoAtual - Número do turno atual
 */
async function processarDuracaoPersonagem(personagemId, turnoAtual) {
    try {
        // Obter último turno processado
        const { data: personagem, error: erroPersonagem } = await supabase
            .from('personagens')
            .select('ultimo_turno_processado')
            .eq('id', personagemId)
            .single();

        if (erroPersonagem) throw erroPersonagem;

        const ultimoTurnoProcessado = personagem.ultimo_turno_processado || 0;

        // Se já foi processado neste turno, sair
        if (ultimoTurnoProcessado >= turnoAtual) {
            return;
        }

        // Processar habilidades com duração
        await decrementarDuracoes(personagemId, 'habilidades');

        // Processar magias com duração
        await decrementarDuracoes(personagemId, 'magias');

        // Processar itens com duração
        await decrementarDuracoes(personagemId, 'inventario');

        // Atualizar último turno processado
        await supabase
            .from('personagens')
            .update({ ultimo_turno_processado: turnoAtual })
            .eq('id', personagemId);

        // Recalcular bônus
        await recalcularBonusGlobais(personagemId);

    } catch (error) {
        console.error(`Erro ao processar duração para personagem ${personagemId}:`, error.message);
    }
}

/**
 * Decrementa a duração de itens em uma tabela específica
 * @param {string} personagemId - ID do personagem
 * @param {string} tabela - Nome da tabela ('habilidades', 'magias', 'inventario')
 */
async function decrementarDuracoes(personagemId, tabela) {
    try {
        // Obter todos os itens ativos com duração
        const { data: itens, error: erroItens } = await supabase
            .from(tabela)
            .select('*')
            .eq('personagem_id', personagemId)
            .eq('ativa', true)
            .not('turnos_restantes', 'is', null)
            .gt('turnos_restantes', 0);

        if (erroItens) throw erroItens;

        // Decrementar cada item
        for (const item of itens) {
            const novosTurnos = item.turnos_restantes - 1;
            const estaInativo = novosTurnos === 0;

            const { error } = await supabase
                .from(tabela)
                .update({
                    turnos_restantes: novosTurnos,
                    ativa: !estaInativo, // Desativa se chegar a 0
                    deativada_em: estaInativo ? new Date().toISOString() : null
                })
                .eq('id', item.id);

            if (error) throw error;

            // Log visual
            if (estaInativo) {
                console.log(`⏰ ${item.nome} expirou em ${tabela}`);
            }
        }

    } catch (error) {
        console.error(`Erro ao decrementar durações em ${tabela}:`, error.message);
    }
}

/**
 * Ativa um item com duração em um turno específico da campanha
 * @param {string} personagemId - ID do personagem
 * @param {string} itemId - ID do item
 * @param {string} tabela - Tabela do item ('habilidades', 'magias', 'inventario')
 * @param {number} duracaoTurnos - Quantos turnos durará
 * @param {string} campanhaId - ID da campanha (para obter turno atual)
 */
async function ativarItemComDuracao(personagemId, itemId, tabela, duracaoTurnos, campanhaId) {
    try {
        // Obter item
        const { data: item, error: erroItem } = await supabase
            .from(tabela)
            .select('*')
            .eq('id', itemId)
            .single();

        if (erroItem) throw erroItem;

        // Obter turno atual da campanha
        const { data: campanha, error: erroCampanha } = await supabase
            .from('campanhas')
            .select('turno_atual')
            .eq('id', campanhaId)
            .single();

        if (erroCampanha) throw erroCampanha;

        const turnoAtual = campanha.turno_atual || 0;

        // Verificar recursos se for magia ou habilidade
        if ((tabela === 'magias' || tabela === 'habilidades') && (item.custo_mana || item.custo_estamina)) {
            const { data: personagem } = await supabase
                .from('personagens')
                .select('mana_atual, estamina_atual')
                .eq('id', personagemId)
                .single();

            const manaSuficiente = personagem.mana_atual >= (item.custo_mana || 0);
            const estaminaSuficiente = personagem.estamina_atual >= (item.custo_estamina || 0);

            if (!manaSuficiente || !estaminaSuficiente) {
                return {
                    success: false,
                    error: 'Recursos insuficientes'
                };
            }

            // Descontar recursos
            const novaMana = personagem.mana_atual - (item.custo_mana || 0);
            const novaEstamina = personagem.estamina_atual - (item.custo_estamina || 0);

            await supabase
                .from('personagens')
                .update({
                    mana_atual: novaMana,
                    estamina_atual: novaEstamina
                })
                .eq('id', personagemId);
        }

        // Ativar item com duração
        const { error: erroAtualizar } = await supabase
            .from(tabela)
            .update({
                ativa: true,
                ativada_em: new Date().toISOString(),
                turno_ativacao: turnoAtual,
                duracao_turnos: duracaoTurnos,
                turnos_restantes: duracaoTurnos
            })
            .eq('id', itemId);

        if (erroAtualizar) throw erroAtualizar;

        return {
            success: true,
            mensagem: `✅ ${item.nome} ativada por ${duracaoTurnos} turno(s)!`,
            turno_ativacao: turnoAtual
        };

    } catch (error) {
        console.error('Erro ao ativar item com duração:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Reseta todos os turnos da campanha para 0 e desativa itens com duração
 * @param {string} campanhaId - ID da campanha
 * @returns {Promise} Resultado da operação
 */
async function resetarTurnosCampanha(campanhaId) {
    try {
        // 1. Obter dados da campanha
        const { data: campanha, error: erroCampanha } = await supabase
            .from('campanhas')
            .select('turno_atual, narrador_id')
            .eq('id', campanhaId)
            .single();

        if (erroCampanha) throw erroCampanha;

        // 2. Verificar se o usuário é o narrador da campanha
        const usuario = await getCurrentUser();
        if (!usuario || usuario.id !== campanha.narrador_id) {
            return {
                success: false,
                error: 'Apenas o narrador da campanha pode resetar turnos'
            };
        }

        // 3. Resetar turno da campanha para 0
        const { error: erroAtualizar } = await supabase
            .from('campanhas')
            .update({ turno_atual: 0 })
            .eq('id', campanhaId);

        if (erroAtualizar) throw erroAtualizar;

        // 4. Buscar personagens da campanha
        const { data: personagensCampanha, error: erroPersonagens } = await supabase
            .from('campanha_personagens')
            .select('personagem_id')
            .eq('campanha_id', campanhaId);

        if (erroPersonagens) throw erroPersonagens;

        // 5. Desativar todos os itens com duração de todos os personagens
        if (personagensCampanha && personagensCampanha.length > 0) {
            for (const cp of personagensCampanha) {
                // Desativar magias
                await supabase
                    .from('magias')
                    .update({
                        ativa: false,
                        turno_ativacao: null,
                        turnos_restantes: null,
                        deativada_em: new Date().toISOString()
                    })
                    .eq('personagem_id', cp.personagem_id)
                    .gt('duracao_turnos', 0);

                // Desativar habilidades
                await supabase
                    .from('habilidades')
                    .update({
                        ativa: false,
                        turno_ativacao: null,
                        turnos_restantes: null,
                        deativada_em: new Date().toISOString()
                    })
                    .eq('personagem_id', cp.personagem_id)
                    .gt('duracao_turnos', 0);

                // Desativar itens
                await supabase
                    .from('inventario')
                    .update({
                        ativa: false,
                        turno_ativacao: null,
                        turnos_restantes: null,
                        deativada_em: new Date().toISOString()
                    })
                    .eq('personagem_id', cp.personagem_id)
                    .gt('duracao_turnos', 0);

                // Resetar último turno processado
                await supabase
                    .from('personagens')
                    .update({ ultimo_turno_processado: 0 })
                    .eq('id', cp.personagem_id);
            }
        }

        return {
            success: true,
            mensagem: `✅ Turnos resetados para 0! Todos os itens com duração foram desativados.`,
            turno_novo: 0
        };

    } catch (error) {
        console.error('Erro ao resetar turnos da campanha:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Obtém o turno atual de uma campanha
 * @param {string} campanhaId - ID da campanha
 */
async function obterTurnoAtual(campanhaId) {
    try {
        const { data: campanha, error } = await supabase
            .from('campanhas')
            .select('turno_atual')
            .eq('id', campanhaId)
            .single();

        if (error) throw error;

        return {
            success: true,
            turno: campanha.turno_atual || 0
        };

    } catch (error) {
        console.error('Erro ao obter turno atual:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Obtém histórico de turnos de uma campanha
 * @param {string} campanhaId - ID da campanha
 */
async function obterHistoricoTurnos(campanhaId) {
    try {
        const { data: turnos, error } = await supabase
            .from('campanha_turnos')
            .select('numero_turno, criado_em, passado_por')
            .eq('campanha_id', campanhaId)
            .order('numero_turno', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            data: turnos
        };

    } catch (error) {
        console.error('Erro ao obter histórico de turnos:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Renderiza informações de duração de um item
 */
function renderizarInfoDuracao(item) {
    if (!item.duracao_turnos) return '';

    const percentual = (item.turnos_restantes / item.duracao_turnos) * 100;
    const cor = percentual > 50 ? '#51cf66' : percentual > 25 ? '#ffd700' : '#ff6b6b';

    return `
        <div style="margin-top: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; color: #e0e0e0; margin-bottom: 4px;">
                <span>Duração:</span>
                <span>${item.turnos_restantes}/${item.duracao_turnos} turnos</span>
            </div>
            <div style="width: 100%; height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
                <div style="width: ${percentual}%; height: 100%; background: ${cor}; transition: width 0.3s;"></div>
            </div>
        </div>
    `;
}

/**
 * Renderiza botão para o dono passar turno na campanha
 */
function renderizarBotaoPassarTurno(campanhaId) {
    return `
        <button onclick="executarPassarTurnoCampanha('${campanhaId}')" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: 2px solid #667eea;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        ">
            ⏭️ Passar Turno
        </button>
    `;
}

/**
 * Executa passar turno (função vincada ao botão)
 */
async function executarPassarTurnoCampanha(campanhaId) {
    console.log('⏳ Passando turno para toda a campanha...');
    const resultado = await passarTurnoCampanha(campanhaId);

    if (resultado.success) {
        console.log('✅', resultado.mensagem);
        
        // Recarregar dados
        if (typeof carregarPersonagensJogadores === 'function') {
            await carregarPersonagensJogadores();
        }
        if (typeof carregarDadosCampanha === 'function') {
            await carregarDadosCampanha();
        }
    } else {
        console.error('❌', resultado.error);
        alert('Erro: ' + resultado.error);
    }
}
