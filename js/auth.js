// ===============================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ===============================================

// Inicializa o cliente Supabase


// ===============================================
// 2. ELEMENTOS DO DOM (INTERFACE)
// ===============================================
const loginLink = document.getElementById('login-link');
const loginBtn = document.getElementById('loginBtn');
const userAvatarWrapper = document.getElementById('user-avatar-wrapper');
const profilePicture = document.getElementById('profile-picture');
const userSidebar = document.getElementById('user-sidebar');
const sidebarPic = document.getElementById('sidebar-pic');
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const logoutBtn = document.getElementById('logoutBtn');
const fichasNav = document.getElementById('fichasNav');
const campanhasNav = document.getElementById('campanhasNav');

// ===============================================
// 3. FUNÇÕES DE UI (ATUALIZAR A TELA)
// ===============================================

/**
 * Atualiza a barra de navegação e a sidebar baseada no estado de autenticação.
 */
async function updateNavbar() {
    // Passo CRÍTICO: Pega a sessão atual, que lê o token da URL de redirecionamento.
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // Elementos do index.html
    const loginItem = document.getElementById('loginItem');
    const userItem = document.getElementById('userItem');
    const userEmail = document.getElementById('userEmail');

    console.log('👤 Estado do Usuário:', user ? 'Logado como ' + user.email : 'Deslogado');

    if (userSidebar) userSidebar.classList.remove('open');

    if (user) {
        // --- USUÁRIO LOGADO ---
        if (loginItem) loginItem.style.display = 'none';
        if (userItem) userItem.style.display = 'flex';
        if (userEmail) userEmail.textContent = user.email;
        if (fichasNav) fichasNav.style.display = 'block';
        if (campanhasNav) campanhasNav.style.display = 'block';
    } else {
        // --- USUÁRIO DESLOGADO ---
        if (loginItem) loginItem.style.display = 'flex';
        if (userItem) userItem.style.display = 'none';
        if (userEmail) userEmail.textContent = '';
        if (fichasNav) fichasNav.style.display = 'none';
        if (campanhasNav) campanhasNav.style.display = 'none';
    }
}

// ===============================================
// 4. FUNÇÕES DE AUTENTICAÇÃO
// ===============================================

// Inicia o fluxo de login com o Google
async function loginWithGoogle() {
    console.log("🔄 Iniciando login com Google...");
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Garante que o redirecionamento volta para a URL principal do Vercel
            redirectTo: window.location.origin 
        }
    });

    if (error) console.error('Erro Google:', error.message);
    return { success: !error };
}

// Faz o logout do utilizador
async function signOutUser() {
    const { error } = await supabase.auth.signOut();
    
    if (userSidebar) userSidebar.classList.remove('open');
    window.location.reload(); 
    return { success: !error };
}

// Função placeholder para criação/atualização de perfil (adapte se necessário)
async function createOrUpdateProfile(user, username = null) {
    console.log("Salvando perfil para:", user.email);
}

// Adicione esta função ao seu js/auth.js

/**
 * Retorna o usuário logado atualmente ou null.
 */
async function getCurrentUser() {
    // Usa getSession() para garantir que a sessão foi lida do Storage/URL
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}

// ===============================================
// 5. ESCUTADORES DE EVENTOS
// ===============================================

// Abrir/Fechar Sidebar
if (userAvatarWrapper) {
    userAvatarWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        if (userSidebar) userSidebar.classList.toggle('open');
    });
}

// Fechar Sidebar ao clicar fora
document.addEventListener('click', (event) => {
    if (userSidebar && userSidebar.classList.contains('open') && 
        !userSidebar.contains(event.target) && 
        !userAvatarWrapper.contains(event.target)) {
        userSidebar.classList.remove('open');
    }
});

// Botão de Sair (Logout)
if (logoutBtn) {
    logoutBtn.addEventListener('click', signOutUser);
}

// Botão de Login
if (loginBtn) {
    loginBtn.addEventListener('click', loginWithGoogle);
}

// ===============================================
// 6. INICIALIZAÇÃO E DETEÇÃO DE SESSÃO (A SOLUÇÃO)
// ===============================================

// Listener de Estado: Captura a mudança de autenticação em tempo real
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`🔔 Evento Supabase: ${event}`);
    
    // Se logou (SIGNED_IN) ou se a página carregou com o token (INITIAL_SESSION)
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        updateNavbar();
        
        // CORREÇÃO CRÍTICA: Limpa o token da URL (#access_token=...) para o utilizador
        if (window.location.hash && window.location.hash.includes('access_token')) {
            console.log("🧹 Limpando token da URL...");
            // Substitui o estado do histórico sem recarregar
            window.history.replaceState(null, '', window.location.pathname);
        }
    } else if (event === 'SIGNED_OUT') {
        updateNavbar();
    }
});

// Inicialização: Força a verificação da sessão imediatamente no carregamento
(async function init() {
    console.log("🚀 Auth Script Iniciado. Forçando verificação de sessão...");
    await updateNavbar();
})()
/**
 * Bloqueia páginas que exigem login e mostra aviso.
 * Retorna true se o usuário estiver logado.
 */
async function requireLogin() {
    const user = await getCurrentUser();

    if (!user) {
        console.warn("❌ Acesso negado. Usuário não está logado.");
        
        // Mostrar aviso customizado
        const confirmed = await showConfirmDialog(
            'Você precisa estar logado para acessar esta página!\n\nFaça login com sua conta Google para continuar.',
            {
                confirmText: 'Ir para Login',
                cancelText: 'Cancelar'
            }
        );
        
        // Se confirmar, inicia login com Google
        if (confirmed) {
            await loginWithGoogle();
        } else {
            // Se cancelar, volta para a home
            window.location.href = "../index.html";
        }
        
        return false;
    }

    console.log("✔ Acesso permitido. Usuário logado:", user.email);
    return true;
};