// Configuração do Supabase
const SUPABASE_URL = 'https://rdrbhapthqnpdtqubuwo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcmJoYXB0aHFucGR0cXVidXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTE2MDUsImV4cCI6MjA3NTM4NzYwNX0.QjZOhXNBYU_F5HKjVDRfY6aFNsNSDodX3q4YJbBwM8U';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* =============================================== */
/* REFERÊNCIAS AO DOM (PARA LÓGICA DE UI)          */
/* =============================================== */

// Elementos da Navbar
const loginLink = document.getElementById('login-link'); // O link "Login" ou "Entrar"
const fichasNav = document.getElementById('fichasNav');
const campanhasNav = document.getElementById('campanhasNav');

// Elementos do Avatar/Sidebar
const userAvatarWrapper = document.getElementById('user-avatar-wrapper');
const profilePicture = document.getElementById('profile-picture');
const userSidebar = document.getElementById('user-sidebar');
const sidebarPic = document.getElementById('sidebar-pic');
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const logoutButton = document.getElementById('logout-button');


/* =============================================== */
/* FUNÇÕES DE AUTENTICAÇÃO                         */
/* =============================================== */

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

async function loginWithGoogle() {
    try {
        // Redireciona o usuário para a tela de login do Google
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Isso garante que ele volte para o site onde o usuário está (Vercel ou Localhost)
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
        // Tenta usar o username fornecido, o username dos metadados, ou a parte inicial do email
        const profileUsername = username || user.user_metadata?.username || user.email.split('@')[0];
        
        // Também busca URL da foto do Google ou avatar_url, se existirem
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        const { error } = await supabase
            .from('perfis')
            .upsert({
                id: user.id,
                email: user.email,
                username: profileUsername,
                avatar_url: avatarUrl, // Salva o avatar para uso futuro
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
        
        // Fecha a sidebar após o logout
        if (userSidebar) userSidebar.classList.remove('open');

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
        // Substituí o 'alert()' por um console.error ou mensagem de UI personalizada
        console.error('Acesso negado: Usuário precisa estar logado.');
        window.location.href = '../index.html';
        return false;
    }
    
    return true;
}


/* =============================================== */
/* LÓGICA DE UI DA NAVBAR (ATUALIZADA)             */
/* =============================================== */

/**
 * Atualiza a visibilidade da navbar (Login vs. Avatar) e preenche a sidebar.
 */
async function updateNavbar() {
    const user = await getCurrentUser();

    // Garante que a sidebar está fechada ao atualizar o estado
    if (userSidebar) userSidebar.classList.remove('open');

    if (user) {
        // --- Usuário logado ---
        
        // Esconde o link "Login" e mostra o Avatar
        if (loginLink) loginLink.style.display = 'none';
        if (userAvatarWrapper) userAvatarWrapper.style.display = 'block';

        // Pega URL e nome do Google/Metadata
        const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        
        // Atualiza a imagem do Avatar na Navbar e na Sidebar
        if (profilePicture && photoUrl) profilePicture.src = photoUrl;
        if (sidebarPic && photoUrl) sidebarPic.src = photoUrl;
        
        // Atualiza textos na Sidebar
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarEmail) sidebarEmail.textContent = user.email;

        // Mostra links restritos
        if (fichasNav) fichasNav.style.display = 'block';
        if (campanhasNav) campanhasNav.style.display = 'block';

    } else {
        // --- Usuário não logado ---

        // Mostra o link "Login" e esconde o Avatar
        if (loginLink) loginLink.style.display = 'block';
        if (userAvatarWrapper) userAvatarWrapper.style.display = 'none';

        // Esconde links restritos
        if (fichasNav) fichasNav.style.display = 'none';
        if (campanhasNav) campanhasNav.style.display = 'none';
    }
}


/* =============================================== */
/* LISTENERS DE EVENTOS E INICIALIZAÇÃO            */
/* =============================================== */

// 1. Escutar mudanças de autenticação em TEMPO REAL
// Isso captura quando o Supabase termina de processar o login do Google
supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Mudança de Estado de Auth:', event);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Se logou, atualiza a interface imediatamente
        updateNavbar();
    } else if (event === 'SIGNED_OUT') {
        updateNavbar();
    }
});

// 2. Listener: Clicar no Avatar para Abrir/Fechar a Sidebar
if (userAvatarWrapper && userSidebar) {
    userAvatarWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        userSidebar.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
        if (
            userSidebar.classList.contains('open') &&
            !userSidebar.contains(event.target) &&
            !userAvatarWrapper.contains(event.target)
        ) {
            userSidebar.classList.remove('open');
        }
    });
}

// 3. Listener: Botão de Sair
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const result = await signOutUser();
        if (!result.success) {
            console.error('Erro ao fazer logout:', result.error);
        }
    });
}

// 4. INICIALIZAÇÃO CRÍTICA (A CORREÇÃO)
// Em vez de chamar updateNavbar() direto, usamos getSession()
// O getSession() é quem lê a URL do Google (#access_token...) e restaura a sessão.
async function initAuth() {
    console.log("🔍 Verificando sessão inicial...");
    
    // Verifica se há uma sessão ativa ou recupera da URL
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error("Erro na sessão:", error);
    }

    // Agora que o getSession rodou, o updateNavbar vai pegar o usuário correto
    await updateNavbar();
}

// Inicia a verificação
initAuth();