// Funções de Autenticação Completas

// Login com Email e Senha
async function loginWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Criar ou atualizar perfil
        if (data.user) {
            await createOrUpdateProfile(data.user);
        }

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return { success: false, error: error.message };
    }
}

// Login com Google
async function loginWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        return { success: false, error: error.message };
    }
}

// Registrar Nova Conta
async function registerUser(email, password, username) {
    try {
        // Validar senha
        if (password.length < 6) {
            return { success: false, error: 'Senha deve ter no mínimo 6 caracteres' };
        }

        // Criar usuário
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Criar perfil
        if (data.user) {
            await createOrUpdateProfile(data.user, username);
        }

        return { 
            success: true, 
            message: 'Conta criada! Verifique seu email para confirmar.',
            user: data.user 
        };
    } catch (error) {
        console.error('Erro ao registrar:', error);
        return { success: false, error: error.message };
    }
}

// Recuperar Senha
async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
        };
    } catch (error) {
        console.error('Erro ao recuperar senha:', error);
        return { success: false, error: error.message };
    }
}

// Criar ou Atualizar Perfil
async function createOrUpdateProfile(user, username = null) {
    try {
        const profileUsername = username || user.user_metadata?.username || user.email.split('@')[0];

        const { error } = await supabase
            .from('perfis')
            .upsert({
                id: user.id,
                email: user.email,
                username: profileUsername,
                atualizado_em: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (error) {
            console.error('Erro ao criar/atualizar perfil:', error);
        }

        return { success: !error };
    } catch (error) {
        console.error('Erro ao criar/atualizar perfil:', error);
        return { success: false, error: error.message };
    }
}

// Obter Usuário Atual
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        return user;
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        return null;
    }
}

// Fazer Logout
async function signOutUser() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        return { success: false, error: error.message };
    }
}

// Verificar se usuário está logado
async function isUserLoggedIn() {
    const user = await getCurrentUser();
    return user !== null;
}

// Require Login (redireciona se não logado)
async function requireLogin() {
    const isLoggedIn = await isUserLoggedIn();
    
    if (!isLoggedIn) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = '../index.html';
        return false;
    }
    
    return true;
}

// Escutar mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        updateNavbar();
    } else if (event === 'SIGNED_OUT') {
        updateNavbar();
    }
});

// Atualizar navbar baseado no estado de autenticação
async function updateNavbar() {
    const user = await getCurrentUser();
    const loginNav = document.getElementById('loginNav');
    const userMenuNav = document.getElementById('userMenuNav');
    const fichasNav = document.getElementById('fichasNav');
    const campanhasNav = document.getElementById('campanhasNav');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // Usuário logado
        if (loginNav) loginNav.style.display = 'none';
        if (userMenuNav) {
            userMenuNav.style.display = 'block';
            if (userEmail) userEmail.textContent = user.email;
        }
        if (fichasNav) fichasNav.style.display = 'block';
        if (campanhasNav) campanhasNav.style.display = 'block';
    } else {
        // Usuário não logado
        if (loginNav) loginNav.style.display = 'block';
        if (userMenuNav) userMenuNav.style.display = 'none';
        if (fichasNav) fichasNav.style.display = 'none';
        if (campanhasNav) campanhasNav.style.display = 'none';
    }
}
