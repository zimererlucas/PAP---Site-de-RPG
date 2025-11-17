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
                dano: magia.dano || '0',
                efeito: magia.efeito || '',
                descricao: magia.descricao || '',
                custo_mana: magia.custo_mana || 0,
                custo_estamina: magia.custo_estamina || 0,
                nivel: magia.nivel || 1,
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
                dano: magia.dano || '0',
                efeito: magia.efeito || '',
                descricao: magia.descricao || '',
                custo_mana: magia.custo_mana || 0,
                custo_estamina: magia.custo_estamina || 0,
                nivel: magia.nivel || 1
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
                dano: habilidade.dano || '0',
                efeito: habilidade.efeito || '',
                descricao: habilidade.descricao || '',
                custo_mana: habilidade.custo_mana || 0,
                custo_estamina: habilidade.custo_estamina || 0,
                nivel: habilidade.nivel || 1,
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
                dano: habilidade.dano || '0',
                efeito: habilidade.efeito || '',
                descricao: habilidade.descricao || '',
                custo_mana: habilidade.custo_mana || 0,
                custo_estamina: habilidade.custo_estamina || 0,
                nivel: habilidade.nivel || 1
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
                nivel: conhecimento.nivel || 1
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
                peso: item.peso || 0
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
