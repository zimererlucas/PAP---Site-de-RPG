// ============================================
// SISTEMA DE ATIVAÇÕES/DESATIVAÇÕES
// ============================================

/**
 * Ativa uma magia e gasta mana/estamina
 */
async function ativarMagia(fichaId, magiaId) {
    try {
        // 1. Obter dados da magia
        const { data: magia, error: erroMagia } = await supabase
            .from('magias')
            .select('*')
            .eq('id', magiaId)
            .single();

        if (erroMagia) throw erroMagia;

        // 2. Obter dados do personagem (mana/estamina atual)
        const { data: personagem, error: erroPersonagem } = await supabase
            .from('personagens')
            .select('mana_atual, estamina_atual')
            .eq('id', fichaId)
            .single();

        if (erroPersonagem) throw erroPersonagem;

        // 3. Verificar se tem mana/estamina suficiente
        const manaSuficiente = personagem.mana_atual >= (magia.custo_mana || 0);
        const estaminaSuficiente = personagem.estamina_atual >= (magia.custo_estamina || 0);

        if (!manaSuficiente || !estaminaSuficiente) {
            return {
                success: false,
                error: `Mana ou Estamina insuficiente!`,
                detalhe: `Mana: ${personagem.mana_atual}/${magia.custo_mana || 0} | Estamina: ${personagem.estamina_atual}/${magia.custo_estamina || 0}`
            };
        }

        // 4. Atualizar magia como ativa
        const { error: erroAtualizar } = await supabase
            .from('magias')
            .update({
                ativa: true,
                ativada_em: new Date().toISOString()
            })
            .eq('id', magiaId);

        if (erroAtualizar) throw erroAtualizar;

        // 5. Descontar mana/estamina do personagem
        const novaMana = personagem.mana_atual - (magia.custo_mana || 0);
        const novaEstamina = personagem.estamina_atual - (magia.custo_estamina || 0);

        const { error: erroGasto } = await supabase
            .from('personagens')
            .update({
                mana_atual: novaMana,
                estamina_atual: novaEstamina
            })
            .eq('id', fichaId);

        if (erroGasto) throw erroGasto;

        // 6. Registrar no log
        await registrarAtivacao(fichaId, 'magia', magiaId, magia.nome, true, magia.custo_mana || 0, magia.custo_estamina || 0);

        return {
            success: true,
            mensagem: `✅ ${magia.nome} ativada! Mana: -${magia.custo_mana || 0} | Estamina: -${magia.custo_estamina || 0}`,
            novaMana,
            novaEstamina,
            bonus: magia.bonus || []
        };

    } catch (error) {
        console.error('Erro ao ativar magia:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Desativa uma magia
 */
async function desativarMagia(fichaId, magiaId) {
    try {
        const { data: magia, error: erroMagia } = await supabase
            .from('magias')
            .select('*')
            .eq('id', magiaId)
            .single();

        if (erroMagia) throw erroMagia;

        const { error } = await supabase
            .from('magias')
            .update({
                ativa: false,
                ativada_em: null
            })
            .eq('id', magiaId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'magia', magiaId, magia.nome, false, 0, 0);

        return {
            success: true,
            mensagem: `❌ ${magia.nome} desativada!`
        };

    } catch (error) {
        console.error('Erro ao desativar magia:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Ativa uma habilidade e gasta mana/estamina
 */
async function ativarHabilidade(fichaId, habilidadeId, duracaoTurnos = 0) {
    try {
        // 1. Obter dados da habilidade
        const { data: habilidade, error: erroHabilidade } = await supabase
            .from('habilidades')
            .select('*')
            .eq('id', habilidadeId)
            .single();

        if (erroHabilidade) throw erroHabilidade;

        // 2. Obter dados do personagem
        const { data: personagem, error: erroPersonagem } = await supabase
            .from('personagens')
            .select('mana_atual, estamina_atual')
            .eq('id', fichaId)
            .single();

        if (erroPersonagem) throw erroPersonagem;

        // 3. Verificar se tem recursos
        const manaSuficiente = personagem.mana_atual >= (habilidade.custo_mana || 0);
        const estaminaSuficiente = personagem.estamina_atual >= (habilidade.custo_estamina || 0);

        if (!manaSuficiente || !estaminaSuficiente) {
            return {
                success: false,
                error: `Mana ou Estamina insuficiente!`,
                detalhe: `Mana: ${personagem.mana_atual}/${habilidade.custo_mana || 0} | Estamina: ${personagem.estamina_atual}/${habilidade.custo_estamina || 0}`
            };
        }

        // 4. Atualizar habilidade como ativa
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

        // 5. Descontar mana/estamina
        const novaMana = personagem.mana_atual - (habilidade.custo_mana || 0);
        const novaEstamina = personagem.estamina_atual - (habilidade.custo_estamina || 0);

        const { error: erroGasto } = await supabase
            .from('personagens')
            .update({
                mana_atual: novaMana,
                estamina_atual: novaEstamina
            })
            .eq('id', fichaId);

        if (erroGasto) throw erroGasto;

        await registrarAtivacao(fichaId, 'habilidade', habilidadeId, habilidade.nome, true, habilidade.custo_mana || 0, habilidade.custo_estamina || 0);

        const mensagem = duracaoTurnos > 0 
            ? `✅ ${habilidade.nome} ativada por ${duracaoTurnos} turnos! Mana: -${habilidade.custo_mana || 0} | Estamina: -${habilidade.custo_estamina || 0}`
            : `✅ ${habilidade.nome} ativada! Mana: -${habilidade.custo_mana || 0} | Estamina: -${habilidade.custo_estamina || 0}`;

        return {
            success: true,
            mensagem,
            novaMana,
            novaEstamina,
            bonus: habilidade.bonus || [],
            duracaoTurnos
        };

    } catch (error) {
        console.error('Erro ao ativar habilidade:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Desativa uma habilidade
 */
async function desativarHabilidade(fichaId, habilidadeId) {
    try {
        const { data: habilidade, error: erroHabilidade } = await supabase
            .from('habilidades')
            .select('*')
            .eq('id', habilidadeId)
            .single();

        if (erroHabilidade) throw erroHabilidade;

        const { error } = await supabase
            .from('habilidades')
            .update({
                ativa: false,
                ativada_em: null,
                turnos_restantes: 0
            })
            .eq('id', habilidadeId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'habilidade', habilidadeId, habilidade.nome, false, 0, 0);

        return {
            success: true,
            mensagem: `❌ ${habilidade.nome} desativada!`
        };

    } catch (error) {
        console.error('Erro ao desativar habilidade:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Ativa um conhecimento
 */
async function ativarConhecimento(fichaId, conhecimentoId) {
    try {
        const { data: conhecimento, error: erroConhecimento } = await supabase
            .from('conhecimentos')
            .select('*')
            .eq('id', conhecimentoId)
            .single();

        if (erroConhecimento) throw erroConhecimento;

        const { error } = await supabase
            .from('conhecimentos')
            .update({
                ativa: true,
                ativada_em: new Date().toISOString()
            })
            .eq('id', conhecimentoId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'conhecimento', conhecimentoId, conhecimento.nome, true, 0, 0);

        return {
            success: true,
            mensagem: `✅ ${conhecimento.nome} ativado!`,
            bonus: conhecimento.bonus || []
        };

    } catch (error) {
        console.error('Erro ao ativar conhecimento:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Desativa um conhecimento
 */
async function desativarConhecimento(fichaId, conhecimentoId) {
    try {
        const { data: conhecimento, error: erroConhecimento } = await supabase
            .from('conhecimentos')
            .select('*')
            .eq('id', conhecimentoId)
            .single();

        if (erroConhecimento) throw erroConhecimento;

        const { error } = await supabase
            .from('conhecimentos')
            .update({
                ativa: false,
                ativada_em: null
            })
            .eq('id', conhecimentoId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'conhecimento', conhecimentoId, conhecimento.nome, false, 0, 0);

        return {
            success: true,
            mensagem: `❌ ${conhecimento.nome} desativado!`
        };

    } catch (error) {
        console.error('Erro ao desativar conhecimento:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Ativa um item do inventário
 */
async function ativarItem(fichaId, itemId) {
    try {
        const { data: item, error: erroItem } = await supabase
            .from('inventario')
            .select('*')
            .eq('id', itemId)
            .single();

        if (erroItem) throw erroItem;

        const { error } = await supabase
            .from('inventario')
            .update({
                ativa: true,
                ativada_em: new Date().toISOString()
            })
            .eq('id', itemId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'item', itemId, item.nome, true, 0, 0);

        return {
            success: true,
            mensagem: `✅ ${item.nome} ativado!`,
            bonus: item.bonus || []
        };

    } catch (error) {
        console.error('Erro ao ativar item:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Desativa um item do inventário
 */
async function desativarItem(fichaId, itemId) {
    try {
        const { data: item, error: erroItem } = await supabase
            .from('inventario')
            .select('*')
            .eq('id', itemId)
            .single();

        if (erroItem) throw erroItem;

        const { error } = await supabase
            .from('inventario')
            .update({
                ativa: false,
                ativada_em: null
            })
            .eq('id', itemId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'item', itemId, item.nome, false, 0, 0);

        return {
            success: true,
            mensagem: `❌ ${item.nome} desativado!`
        };

    } catch (error) {
        console.error('Erro ao desativar item:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Ativa uma passiva
 */
async function ativarPassiva(fichaId, nomePassiva) {
    try {
        const { data: personagem, error: erroPersonagem } = await supabase
            .from('personagens')
            .select('passivas_ativas')
            .eq('id', fichaId)
            .single();

        if (erroPersonagem) throw erroPersonagem;

        const ativas = personagem.passivas_ativas || [];

        // Verificar se já está ativa
        if (ativas.includes(nomePassiva)) {
            return {
                success: false,
                error: `${nomePassiva} já está ativa!`
            };
        }

        ativas.push(nomePassiva);

        const { error } = await supabase
            .from('personagens')
            .update({
                passivas_ativas: ativas
            })
            .eq('id', fichaId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'passiva', fichaId, nomePassiva, true, 0, 0);

        return {
            success: true,
            mensagem: `✅ ${nomePassiva} ativada!`
        };

    } catch (error) {
        console.error('Erro ao ativar passiva:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Desativa uma passiva
 */
async function desativarPassiva(fichaId, nomePassiva) {
    try {
        const { data: personagem, error: erroPersonagem } = await supabase
            .from('personagens')
            .select('passivas_ativas')
            .eq('id', fichaId)
            .single();

        if (erroPersonagem) throw erroPersonagem;

        let ativas = personagem.passivas_ativas || [];
        ativas = ativas.filter(p => p !== nomePassiva);

        const { error } = await supabase
            .from('personagens')
            .update({
                passivas_ativas: ativas
            })
            .eq('id', fichaId);

        if (error) throw error;

        await registrarAtivacao(fichaId, 'passiva', fichaId, nomePassiva, false, 0, 0);

        return {
            success: true,
            mensagem: `❌ ${nomePassiva} desativada!`
        };

    } catch (error) {
        console.error('Erro ao desativar passiva:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Calcula bônus totais apenas de itens ATIVOS
 */
async function calcularBonusAtivos(fichaId, tipo = 'all') {
    try {
        let bonus = {};

        // Magias ativas
        if (tipo === 'all' || tipo === 'magia') {
            const { data: magias } = await supabase
                .from('magias')
                .select('bonus')
                .eq('personagem_id', fichaId)
                .eq('ativa', true);

            magias?.forEach(m => {
                if (m.bonus && Array.isArray(m.bonus)) {
                    m.bonus.forEach(b => {
                        bonus[b.atributo] = (bonus[b.atributo] || 0) + b.valor;
                    });
                }
            });
        }

        // Habilidades ativas
        if (tipo === 'all' || tipo === 'habilidade') {
            const { data: habilidades } = await supabase
                .from('habilidades')
                .select('bonus')
                .eq('personagem_id', fichaId)
                .eq('ativa', true);

            habilidades?.forEach(h => {
                if (h.bonus && Array.isArray(h.bonus)) {
                    h.bonus.forEach(b => {
                        bonus[b.atributo] = (bonus[b.atributo] || 0) + b.valor;
                    });
                }
            });
        }

        // Conhecimentos ativos
        if (tipo === 'all' || tipo === 'conhecimento') {
            const { data: conhecimentos } = await supabase
                .from('conhecimentos')
                .select('bonus')
                .eq('personagem_id', fichaId)
                .eq('ativa', true);

            conhecimentos?.forEach(c => {
                if (c.bonus && Array.isArray(c.bonus)) {
                    c.bonus.forEach(b => {
                        bonus[b.atributo] = (bonus[b.atributo] || 0) + b.valor;
                    });
                }
            });
        }

        // Itens ativos
        if (tipo === 'all' || tipo === 'item') {
            const { data: itens } = await supabase
                .from('inventario')
                .select('bonus')
                .eq('personagem_id', fichaId)
                .eq('ativa', true);

            itens?.forEach(i => {
                if (i.bonus && Array.isArray(i.bonus)) {
                    i.bonus.forEach(b => {
                        bonus[b.atributo] = (bonus[b.atributo] || 0) + b.valor;
                    });
                }
            });
        }

        return {
            success: true,
            bonus
        };

    } catch (error) {
        console.error('Erro ao calcular bônus ativos:', error.message);
        return { success: false, error: error.message, bonus: {} };
    }
}

/**
 * Reduz turnos restantes de habilidades ativas (chamado quando mestre passa turno)
 */
async function passarTurno(fichaId) {
    try {
        const { data: habilidades, error: erroHabilidades } = await supabase
            .from('habilidades')
            .select('*')
            .eq('personagem_id', fichaId)
            .eq('ativa', true)
            .gt('turnos_restantes', 0);

        if (erroHabilidades) throw erroHabilidades;

        // Para cada habilidade, reduzir um turno
        for (const hab of habilidades) {
            const novosturnos = hab.turnos_restantes - 1;

            const { error } = await supabase
                .from('habilidades')
                .update({
                    turnos_restantes: novosturnos,
                    ativa: novosturnos > 0 // Se chegar a 0, desativa
                })
                .eq('id', hab.id);

            if (error) throw error;
        }

        return {
            success: true,
            mensagem: `✅ Turno passado! ${habilidades.length} habilidades afetadas.`,
            habilidadesAtualizadas: habilidades.length
        };

    } catch (error) {
        console.error('Erro ao passar turno:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Registra ativações no log
 */
async function registrarAtivacao(fichaId, tipo, itemId, nomeItem, ativo, manaGasta, estaminaGasta) {
    try {
        await supabase
            .from('ativacoes_log')
            .insert([{
                personagem_id: fichaId,
                tipo,
                item_id: itemId,
                nome_item: nomeItem,
                ativo,
                mana_gasta: manaGasta,
                estamina_gasta: estaminaGasta
            }]);

    } catch (error) {
        console.warn('Aviso: Log de ativação não foi registrado:', error.message);
    }
}

/**
 * Obter todos os itens ativos de um personagem (para exibição)
 */
async function obterTodosAtivos(fichaId) {
    try {
        const ativosAgrupados = {
            magias: [],
            habilidades: [],
            conhecimentos: [],
            itens: [],
            passivas: []
        };

        // Magias ativas
        const { data: magias } = await supabase
            .from('magias')
            .select('*')
            .eq('personagem_id', fichaId)
            .eq('ativa', true);
        ativosAgrupados.magias = magias || [];

        // Habilidades ativas
        const { data: habilidades } = await supabase
            .from('habilidades')
            .select('*')
            .eq('personagem_id', fichaId)
            .eq('ativa', true);
        ativosAgrupados.habilidades = habilidades || [];

        // Conhecimentos ativos
        const { data: conhecimentos } = await supabase
            .from('conhecimentos')
            .select('*')
            .eq('personagem_id', fichaId)
            .eq('ativa', true);
        ativosAgrupados.conhecimentos = conhecimentos || [];

        // Itens ativos
        const { data: itens } = await supabase
            .from('inventario')
            .select('*')
            .eq('personagem_id', fichaId)
            .eq('ativa', true);
        ativosAgrupados.itens = itens || [];

        // Passivas ativas
        const { data: personagem } = await supabase
            .from('personagens')
            .select('passivas_ativas')
            .eq('id', fichaId)
            .single();
        ativosAgrupados.passivas = personagem?.passivas_ativas || [];

        return {
            success: true,
            ativos: ativosAgrupados
        };

    } catch (error) {
        console.error('Erro ao obter itens ativos:', error.message);
        return { success: false, error: error.message, ativos: {} };
    }
}
