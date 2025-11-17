// Funções para Personagens

async function createPersonagem(personagemData) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Primeiro, obter ou criar perfil
        let { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('id')
            .eq('id', user.id)
            .single();

        if (perfilError && perfilError.code === 'PGRST116') {
            // Perfil não existe, criar um novo
            const { data: novoPerfil, error: createError } = await supabase
                .from('perfis')
                .insert([{
                    id: user.id,
                    username: user.email.split('@')[0],
                    criado_em: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (createError) throw createError;
            perfil = novoPerfil;
        } else if (perfilError) {
            throw perfilError;
        }

        // Agora criar o personagem
        const { data, error } = await supabase
            .from('personagens')
            .insert([{
                ...personagemData,
                perfil_id: perfil.id,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao criar personagem:', error.message);
        return { success: false, error: error.message };
    }
}

async function getPersonagensDoUsuario() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('personagens')
            .select('*')
            .eq('perfil_id', user.id)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar personagens:', error.message);
        return { success: false, error: error.message };
    }
}

async function getPersonagemById(id) {
    try {
        const { data, error } = await supabase
            .from('personagens')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao buscar personagem:', error.message);
        return { success: false, error: error.message };
    }
}

async function updatePersonagem(id, personagemData) {
    try {
        const { data, error } = await supabase
            .from('personagens')
            .update({
                ...personagemData,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar personagem:', error.message);
        return { success: false, error: error.message };
    }
}

async function deletePersonagem(id) {
    try {
        const { error } = await supabase
            .from('personagens')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar personagem:', error.message);
        return { success: false, error: error.message };
    }
}
