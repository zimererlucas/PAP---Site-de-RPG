// Funções para gerenciar campanhas

// Criar nova campanha
async function createCampanha(campanhaData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        // Gerar código único para a campanha
        const codigoCampanha = 'CAMP_' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const { data, error } = await supabase
            .from('campanhas')
            .insert([{
                nome: campanhaData.nome,
                descricao: campanhaData.descricao || null,
                narrador_id: user.id,
                codigo: codigoCampanha,
                ativa: true,
                criada_em: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Erro ao criar campanha:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Obter campanhas do usuário (como narrador)
async function getCampanhasDoUsuario() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('campanhas')
            .select('*')
            .eq('narrador_id', user.id)
            .order('criada_em', { ascending: false });

        if (error) {
            console.error('Erro ao obter campanhas:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Obter campanha por ID
async function getCampanhaById(id) {
    try {
        const { data, error } = await supabase
            .from('campanhas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao obter campanha:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Atualizar campanha
async function updateCampanha(id, campanhaData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('campanhas')
            .update({
                nome: campanhaData.nome,
                descricao: campanhaData.descricao || null,
                ativa: campanhaData.ativa !== undefined ? campanhaData.ativa : true
            })
            .eq('id', id)
            .eq('narrador_id', user.id)
            .select();

        if (error) {
            console.error('Erro ao atualizar campanha:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Deletar campanha
async function deleteCampanha(id) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { error } = await supabase
            .from('campanhas')
            .delete()
            .eq('id', id)
            .eq('narrador_id', user.id);

        if (error) {
            console.error('Erro ao deletar campanha:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Adicionar jogador à campanha
async function adicionarJogadorACampanha(campanhaId, personagemId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('campanha_personagens')
            .insert([{
                campanha_id: campanhaId,
                personagem_id: personagemId,
                jogador_id: user.id,
                adicionado_em: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Erro ao adicionar jogador:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Obter personagens de uma campanha
async function getPersonagensDAcampanha(campanhaId) {
    try {
        // Buscar relacoes de campanha_personagens
        const { data: participacoes, error: erroParticipacoes } = await supabase
            .from('campanha_personagens')
            .select('*')
            .eq('campanha_id', campanhaId);

        if (erroParticipacoes) {
            console.error('Erro ao obter participacoes:', erroParticipacoes);
            return { success: false, error: erroParticipacoes.message };
        }

        if (!participacoes || participacoes.length === 0) {
            return { success: true, data: [] };
        }

        // Buscar detalhes dos personagens
        const personagemIds = participacoes.map(p => p.personagem_id);
        const { data: personagensData, error: erroPersonagens } = await supabase
            .from('personagens')
            .select('*')
            .in('id', personagemIds);

        if (erroPersonagens) {
            console.error('Erro ao obter personagens:', erroPersonagens);
            return { success: false, error: erroPersonagens.message };
        }

        // Buscar informacoes dos perfis
        const jogadorIds = [...new Set(participacoes.map(p => p.jogador_id))];
        const { data: perfisData } = await supabase
            .from('perfis')
            .select('id, username')
            .in('id', jogadorIds);

        // Criar mapas para rapido acesso
        const personagensMap = {};
        if (personagensData) {
            personagensData.forEach(p => {
                personagensMap[p.id] = p;
            });
        }

        const perfisMap = {};
        if (perfisData) {
            perfisData.forEach(perfil => {
                perfisMap[perfil.id] = perfil.username;
            });
        }

        // Combinar dados
        const resultado = participacoes.map(participacao => ({
            id: participacao.id,
            campanha_id: participacao.campanha_id,
            personagem_id: participacao.personagem_id,
            jogador_id: participacao.jogador_id,
            adicionado_em: participacao.adicionado_em,
            personagem: personagensMap[participacao.personagem_id] || null,
            jogador: {
                id: participacao.jogador_id,
                username: perfisMap[participacao.jogador_id] || 'Usuario'
            }
        }));

        return { success: true, data: resultado };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Obter campanha por código
async function getCampanhaByCodigo(codigo) {
    try {
        const { data, error } = await supabase
            .from('campanhas')
            .select('*')
            .eq('codigo', codigo)
            .single();

        if (error) {
            console.error('Erro ao obter campanha:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Remover jogador da campanha
async function removerJogadorDaCampanha(campanhaPersonagemId) {
    try {
        const { error } = await supabase
            .from('campanha_personagens')
            .delete()
            .eq('id', campanhaPersonagemId);

        if (error) {
            console.error('Erro ao remover jogador:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}
