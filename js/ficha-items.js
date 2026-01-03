// ============================================
// FUNÇÕES PARA GERENCIAR ITENS DA FICHA
// ============================================

// Adicionar Magia
async function adicionarMagia(fichaId, magia) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('magias')
            .insert([{
                personagem_id: fichaId,
                nome: magia.nome,
                efeito: magia.efeito || '',
                descricao: magia.descricao || '',
                custo_mana: magia.custo_mana || 0,
                custo_estamina: magia.custo_estamina || 0,
                nivel: magia.nivel || 1,
                bonus: magia.bonus || [],
                dados: magia.dados || null,
                duracao_turnos: magia.duracao_turnos || null,
                criado_em: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao adicionar magia:', error.message);
        return { success: false, error: error.message };
    }
}

// Obter Magias
async function obterMagias(fichaId) {
    try {
        const { data, error } = await supabase
            .from('magias')
            .select('*')
            .eq('personagem_id', fichaId)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter magias:', error.message);
        return { success: false, error: error.message };
    }
}

// Obter Magia (singular)
async function obterMagia(magiaId) {
    try {
        const { data, error } = await supabase
            .from('magias')
            .select('*')
            .eq('id', magiaId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter magia:', error.message);
        return { success: false, error: error.message };
    }
}

// Atualizar Magia
async function atualizarMagia(magiaId, magia) {
    try {
        const { data, error } = await supabase
            .from('magias')
            .update({
                nome: magia.nome,
                efeito: magia.efeito || '',
                descricao: magia.descricao || '',
                custo_mana: magia.custo_mana || 0,
                custo_estamina: magia.custo_estamina || 0,
                nivel: magia.nivel || 1,
                bonus: magia.bonus || [],
                dados: magia.dados || null,
                duracao_turnos: magia.duracao_turnos || null
            })
            .eq('id', magiaId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar magia:', error.message);
        return { success: false, error: error.message };
    }
}

// Deletar Magia
async function deletarMagia(magiaId) {
    try {
        const { error } = await supabase
            .from('magias')
            .delete()
            .eq('id', magiaId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar magia:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// HABILIDADES
// ============================================

async function adicionarHabilidade(fichaId, habilidade) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('habilidades')
            .insert([{
                personagem_id: fichaId,
                nome: habilidade.nome,
                efeito: habilidade.efeito || '',
                descricao: habilidade.descricao || '',
                custo_mana: habilidade.custo_mana || 0,
                custo_estamina: habilidade.custo_estamina || 0,
                nivel: habilidade.nivel || 1,
                bonus: habilidade.bonus || [],
                dados: habilidade.dados || null,
                duracao_turnos: habilidade.duracao_turnos || null,
                criado_em: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao adicionar habilidade:', error.message);
        return { success: false, error: error.message };
    }
}

async function obterHabilidades(fichaId) {
    try {
        const { data, error } = await supabase
            .from('habilidades')
            .select('*')
            .eq('personagem_id', fichaId)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter habilidades:', error.message);
        return { success: false, error: error.message };
    }
}

// Obter Habilidade (singular)
async function obterHabilidade(habilidadeId) {
    try {
        const { data, error } = await supabase
            .from('habilidades')
            .select('*')
            .eq('id', habilidadeId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter habilidade:', error.message);
        return { success: false, error: error.message };
    }
}

// Atualizar Habilidade
async function atualizarHabilidade(habilidadeId, habilidade) {
    try {
        const { data, error } = await supabase
            .from('habilidades')
            .update({
                nome: habilidade.nome,
                efeito: habilidade.efeito || '',
                descricao: habilidade.descricao || '',
                custo_mana: habilidade.custo_mana || 0,
                custo_estamina: habilidade.custo_estamina || 0,
                nivel: habilidade.nivel || 1,
                bonus: habilidade.bonus || [],
                dados: habilidade.dados || null,
                duracao_turnos: habilidade.duracao_turnos || null
            })
            .eq('id', habilidadeId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar habilidade:', error.message);
        return { success: false, error: error.message };
    }
}

async function deletarHabilidade(habilidadeId) {
    try {
        const { error } = await supabase
            .from('habilidades')
            .delete()
            .eq('id', habilidadeId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar habilidade:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// CONHECIMENTOS
// ============================================

async function adicionarConhecimento(fichaId, conhecimento) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('conhecimentos')
            .insert([{
                personagem_id: fichaId,
                nome: conhecimento.nome,
                descricao: conhecimento.descricao || '',
                nivel: conhecimento.nivel || 1,
                bonus: conhecimento.bonus || [],
                criado_em: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao adicionar conhecimento:', error.message);
        return { success: false, error: error.message };
    }
}

async function obterConhecimentos(fichaId) {
    try {
        const { data, error } = await supabase
            .from('conhecimentos')
            .select('*')
            .eq('personagem_id', fichaId)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter conhecimentos:', error.message);
        return { success: false, error: error.message };
    }
}

// Obter Conhecimento (singular)
async function obterConhecimento(conhecimentoId) {
    try {
        const { data, error } = await supabase
            .from('conhecimentos')
            .select('*')
            .eq('id', conhecimentoId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter conhecimento:', error.message);
        return { success: false, error: error.message };
    }
}

// Atualizar Conhecimento
async function atualizarConhecimento(conhecimentoId, conhecimento) {
    try {
        const { data, error } = await supabase
            .from('conhecimentos')
            .update({
                nome: conhecimento.nome,
                descricao: conhecimento.descricao || '',
                nivel: conhecimento.nivel || 1,
                bonus: conhecimento.bonus || []
            })
            .eq('id', conhecimentoId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar conhecimento:', error.message);
        return { success: false, error: error.message };
    }
}

async function deletarConhecimento(conhecimentoId) {
    try {
        const { error } = await supabase
            .from('conhecimentos')
            .delete()
            .eq('id', conhecimentoId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar conhecimento:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// ITENS (INVENTÁRIO)
// ============================================

async function adicionarItem(fichaId, item) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('inventario')
            .insert([{
                personagem_id: fichaId,
                nome: item.nome,
                quantidade: item.quantidade || 1,
                descricao: item.descricao || '',
                peso: item.peso || 0,
                bonus: item.bonus || [],
                dados: item.dados || null,
                duracao_turnos: item.duracao_turnos || null,
                criado_em: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao adicionar item:', error.message);
        return { success: false, error: error.message };
    }
}

async function obterItens(fichaId) {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .eq('personagem_id', fichaId)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter itens:', error.message);
        return { success: false, error: error.message };
    }
}

async function obterItem(itemId) {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter item:', error.message);
        return { success: false, error: error.message };
    }
}

async function atualizarItem(itemId, item) {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .update({
                nome: item.nome,
                quantidade: item.quantidade || 1,
                descricao: item.descricao || '',
                peso: item.peso || 0,
                bonus: item.bonus || [],
                dados: item.dados || null,
                duracao_turnos: item.duracao_turnos || null
            })
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar item:', error.message);
        return { success: false, error: error.message };
    }
}

async function deletarItem(itemId) {
    try {
        const { error } = await supabase
            .from('inventario')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar item:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// ANOTAÇÕES
// ============================================

async function adicionarAnotacao(fichaId, anotacao) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('anotacoes')
            .insert([{
                personagem_id: fichaId,
                titulo: anotacao.titulo,
                descricao: anotacao.descricao || '',
                criado_em: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao adicionar anotação:', error.message);
        return { success: false, error: error.message };
    }
}

async function obterAnotacoes(fichaId) {
    try {
        const { data, error } = await supabase
            .from('anotacoes')
            .select('*')
            .eq('personagem_id', fichaId)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter anotações:', error.message);
        return { success: false, error: error.message };
    }
}

// Obter Anotacao (singular)
async function obterAnotacao(anotacaoId) {
    try {
        const { data, error } = await supabase
            .from('anotacoes')
            .select('*')
            .eq('id', anotacaoId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter anotação:', error.message);
        return { success: false, error: error.message };
    }
}

// Atualizar Anotacao
async function atualizarAnotacao(anotacaoId, anotacao) {
    try {
        const { data, error } = await supabase
            .from('anotacoes')
            .update({
                titulo: anotacao.titulo,
                descricao: anotacao.descricao || ''
            })
            .eq('id', anotacaoId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar anotação:', error.message);
        return { success: false, error: error.message };
    }
}

async function deletarAnotacao(anotacaoId) {
    try {
        const { error } = await supabase
            .from('anotacoes')
            .delete()
            .eq('id', anotacaoId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar anotação:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// PASSIVAS
// ============================================

async function adicionarPassiva(fichaId, passiva) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // First, get the current passiva array
        const { data: personagem, error: fetchError } = await supabase
            .from('personagens')
            .select('passiva')
            .eq('id', fichaId)
            .single();

        if (fetchError) throw fetchError;

        // Parse com segurança - se não for JSON válido, trata como array vazio
        let currentPassivas = [];
        if (personagem.passiva) {
            try {
                currentPassivas = JSON.parse(personagem.passiva);
                if (!Array.isArray(currentPassivas)) {
                    currentPassivas = [];
                }
            } catch (e) {
                console.warn('Passiva anterior não era JSON válido, resetando para array vazio');
                currentPassivas = [];
            }
        }

        const newPassiva = {
            id: Date.now().toString(), // Simple ID generation
            nome: passiva.nome,
            categoria: passiva.categoria || '',
            efeito: passiva.efeito || '',
            bonus: passiva.bonus || [],
            descricao: passiva.descricao || '',
            criado_em: new Date().toISOString()
        };
        currentPassivas.push(newPassiva);

        const { data, error } = await supabase
            .from('personagens')
            .update({ passiva: JSON.stringify(currentPassivas) })
            .eq('id', fichaId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: newPassiva };
    } catch (error) {
        console.error('Erro ao adicionar passiva:', error.message);
        return { success: false, error: error.message };
    }
}

async function obterPassivas(fichaId) {
    try {
        const { data, error } = await supabase
            .from('personagens')
            .select('passiva')
            .eq('id', fichaId)
            .single();

        if (error) throw error;
        
        // Parse com segurança
        try {
            const passivas = JSON.parse(data.passiva || '[]');
            return { success: true, data: Array.isArray(passivas) ? passivas : [] };
        } catch (e) {
            console.warn('Passiva armazenada não é JSON válido, retornando array vazio');
            return { success: true, data: [] };
        }
    } catch (error) {
        console.error('Erro ao obter passivas:', error.message);
        return { success: false, error: error.message };
    }
}

// Obter Passiva (singular)
async function obterPassiva(fichaId, passivaId) {
    try {
        const { data, error } = await supabase
            .from('personagens')
            .select('passiva')
            .eq('id', fichaId)
            .single();

        if (error) throw error;
        
        // Parse com segurança
        let passivas = [];
        try {
            passivas = JSON.parse(data.passiva || '[]');
        } catch (e) {
            console.warn('Passiva armazenada não é JSON válido');
            return { success: false, error: 'Dados de passiva corrompidos' };
        }
        
        const passiva = passivas.find(p => p.id === passivaId);
        if (!passiva) throw new Error('Passiva não encontrada');
        return { success: true, data: passiva };
    } catch (error) {
        console.error('Erro ao obter passiva:', error.message);
        return { success: false, error: error.message };
    }
}

// Atualizar Passiva
async function atualizarPassiva(fichaId, passivaId, passiva) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // First, get the current passiva array
        const { data: personagem, error: fetchError } = await supabase
            .from('personagens')
            .select('passiva')
            .eq('id', fichaId)
            .single();

        if (fetchError) throw fetchError;

        // Parse com segurança
        let currentPassivas = [];
        try {
            currentPassivas = JSON.parse(personagem.passiva || '[]');
            if (!Array.isArray(currentPassivas)) {
                currentPassivas = [];
            }
        } catch (e) {
            console.warn('Passiva anterior não era JSON válido, resetando para array vazio');
            currentPassivas = [];
        }

        const index = currentPassivas.findIndex(p => p.id === passivaId);
        if (index === -1) throw new Error('Passiva não encontrada');

        currentPassivas[index] = {
            ...currentPassivas[index],
            nome: passiva.nome,
            categoria: passiva.categoria || '',
            efeito: passiva.efeito || '',
            bonus: passiva.bonus || [],
            descricao: passiva.descricao || ''
        };

        const { data, error } = await supabase
            .from('personagens')
            .update({ passiva: JSON.stringify(currentPassivas) })
            .eq('id', fichaId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: currentPassivas[index] };
    } catch (error) {
        console.error('Erro ao atualizar passiva:', error.message);
        return { success: false, error: error.message };
    }
}

async function deletarPassiva(fichaId, passivaId) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Get the current passiva array
        const { data: personagem, error: fetchError } = await supabase
            .from('personagens')
            .select('passiva')
            .eq('id', fichaId)
            .single();

        if (fetchError) throw fetchError;

        // Parse com segurança
        let currentPassivas = [];
        if (personagem.passiva) {
            try {
                currentPassivas = JSON.parse(personagem.passiva);
                if (!Array.isArray(currentPassivas)) {
                    currentPassivas = [];
                }
            } catch (e) {
                console.warn('Passiva anterior não era JSON válido, resetando para array vazio');
                currentPassivas = [];
            }
        }

        // Remove the passiva with matching ID
        currentPassivas = currentPassivas.filter(p => p.id !== passivaId);

        const { data, error } = await supabase
            .from('personagens')
            .update({ passiva: JSON.stringify(currentPassivas) })
            .eq('id', fichaId)
            .select()
            .single();

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar passiva:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// CÁLCULO AUTOMÁTICO DE BÔNUS GLOBAIS
// ============================================

/**
 * Calcula todos os bônus das magias, habilidades, conhecimentos, itens e passivas
 * e atualiza os atributos do personagem
 */
async function recalcularBonusGlobais(fichaId) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Obter todos os items ATIVOS com bônus
        const [magias, habilidades, conhecimentos, itens, personagem] = await Promise.all([
            supabase.from('magias').select('bonus').eq('personagem_id', fichaId).eq('ativa', true),
            supabase.from('habilidades').select('bonus').eq('personagem_id', fichaId).eq('ativa', true),
            supabase.from('conhecimentos').select('bonus').eq('personagem_id', fichaId).eq('ativa', true),
            supabase.from('inventario').select('bonus').eq('personagem_id', fichaId).eq('ativa', true),
            supabase.from('personagens').select('passiva, passivas_ativas').eq('id', fichaId).single()
        ]);

        // Inicializar acumuladores de bônus
        const bonusTotal = {
            forca_bonus: 0,
            agilidade_bonus: 0,
            sorte_bonus: 0,
            inteligencia_bonus: 0,
            foco_bonus: 0,
            arcanismo_bonus: 0,
            vida_maxima_bonus: 0,
            mana_maxima_bonus: 0,
            estamina_maxima_bonus: 0,
            esquiva_bonus: 0,
            acerto_bonus: 0
        };

        // Função auxiliar para somar bônus
        const somarBonus = (items) => {
            if (!items.data) return;
            items.data.forEach(item => {
                if (item.bonus && Array.isArray(item.bonus)) {
                    item.bonus.forEach(bonus => {
                        if (bonusTotal.hasOwnProperty(bonus.atributo)) {
                            bonusTotal[bonus.atributo] += bonus.valor || 0;
                        }
                    });
                }
            });
        };

        // Somar bônus apenas de items ATIVOS
        somarBonus(magias);
        somarBonus(habilidades);
        somarBonus(conhecimentos);
        somarBonus(itens);

        // Somar bônus das passivas ATIVAS
        if (personagem.data?.passivas_ativas && Array.isArray(personagem.data.passivas_ativas)) {
            // Get all passivas
            let passivas = [];
            if (personagem.data.passiva) {
                try {
                    passivas = JSON.parse(personagem.data.passiva);
                    if (!Array.isArray(passivas)) {
                        passivas = [];
                    }
                } catch (e) {
                    console.warn('Passivas armazenadas não são JSON válido');
                    passivas = [];
                }
            }

            // Filter passivas ATIVAS and sum their bonuses
            personagem.data.passivas_ativas.forEach(nomePassivaAtiva => {
                const passiva = passivas.find(p => p.nome === nomePassivaAtiva);
                if (passiva && passiva.bonus && Array.isArray(passiva.bonus)) {
                    passiva.bonus.forEach(bonus => {
                        if (bonusTotal.hasOwnProperty(bonus.atributo)) {
                            bonusTotal[bonus.atributo] += bonus.valor || 0;
                        }
                    });
                }
            });
        }

        // Atualizar personagem com os bônus calculados
        const { data, error } = await supabase
            .from('personagens')
            .update(bonusTotal)
            .eq('id', fichaId)
            .select()
            .single();

        if (error) throw error;
        
        console.log('✅ Bônus recalculados (apenas ATIVOS, incluindo passivas):', bonusTotal);
        return { success: true, data, bonusTotal };
    } catch (error) {
        console.error('Erro ao recalcular bônus globais:', error.message);
        return { success: false, error: error.message };
    }
}
