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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    const loginItem = document.getElementById('loginItem');
    const userItem = document.getElementById('userItem');
    
    // Novos elementos da sidebar e perfil
    const profilePic = document.getElementById('profile-picture');
    const sidebarPic = document.getElementById('sidebar-pic');
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarEmail = document.getElementById('sidebar-email');
    const sidebarLevel = document.getElementById('sidebar-level');
    const sidebarBio = document.getElementById('sidebar-bio');

    console.log('👤 Estado do Usuário:', user ? 'Logado como ' + user.email : 'Deslogado');

    if (userSidebar) userSidebar.classList.remove('open');

    // Resetar modo de edição do username
    const nameDisplay = document.getElementById('sidebar-name');
    const nameInput = document.getElementById('sidebar-name-input');
    const editBtn = document.getElementById('edit-username-btn');
    const editBioBtn = document.getElementById('edit-bio-btn');
    if (nameDisplay) nameDisplay.style.display = 'block';
    if (nameInput) nameInput.style.display = 'none';
    if (editBtn) editBtn.textContent = '✏️';

    const bioDisplay = document.getElementById('sidebar-bio');
    const bioInput = document.getElementById('sidebar-bio-input');
    if (bioDisplay) bioDisplay.style.display = 'block';
    if (bioInput) bioInput.style.display = 'none';
    if (editBioBtn) editBioBtn.textContent = '✏️';

    if (user) {
        // --- USUÁRIO LOGADO ---
        if (loginItem) loginItem.style.display = 'none';
        if (userItem) userItem.style.display = 'flex';
        if (fichasNav) fichasNav.style.display = 'block';
        if (campanhasNav) campanhasNav.style.display = 'block';

        // Pega a foto do Google (user_metadata)
        const googlePhoto = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2a2a35&color=fff`;

        if (profilePic) {
            profilePic.referrerPolicy = "no-referrer";
            profilePic.onerror = () => { profilePic.src = defaultAvatar; };
            profilePic.src = googlePhoto || defaultAvatar;
        }
        if (sidebarPic) {
            sidebarPic.referrerPolicy = "no-referrer";
            sidebarPic.onerror = () => { sidebarPic.src = defaultAvatar; };
            sidebarPic.src = googlePhoto || defaultAvatar;
        }
        if (sidebarName) sidebarName.textContent = fullName;
        if (sidebarEmail) sidebarEmail.textContent = user.email;

        // Busca dados extras na tabela 'perfis'
        try {
            const { data: profile, error } = await supabase
                .from('perfis')
                .select('nivel_conta, bio, username')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = Not Found
                console.error('Erro ao buscar perfil:', error.message);
            }

            if (profile) {
                if (sidebarLevel) sidebarLevel.textContent = profile.nivel_conta || 1;
                if (sidebarBio) sidebarBio.textContent = profile.bio || 'Nenhuma bio definida.';
                if (sidebarName && profile.username) sidebarName.textContent = profile.username;
            } else {
                // Se não existir perfil, cria um básico (pode ser expandido conforme necessário)
                await createOrUpdateProfile(user);
            }
        } catch (err) {
            console.error('Erro inesperado ao processar perfil:', err);
        }

    } else {
        // --- USUÁRIO DESLOGADO ---
        if (loginItem) loginItem.style.display = 'flex';
        if (userItem) userItem.style.display = 'none';
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
            redirectTo: window.location.origin + (window.location.pathname.includes('/pages/') ? '/../index.html' : '/index.html')
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

// Função para garantir que o perfil existe na tabela 'perfis'
async function createOrUpdateProfile(user) {
    const googlePhoto = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const fullName = user.user_metadata?.full_name || user.email.split('@')[0];

    const { error } = await supabase
        .from('perfis')
        .upsert({
            id: user.id,
            username: fullName,
            avatar_url: googlePhoto,
            updated_at: new Date()
        }, { onConflict: 'id' });

    if (error) console.error('Erro ao criar/atualizar perfil:', error.message);
}

/**
 * Obtém o usuário atual de forma segura.
 */
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
}

// ===============================================
// 5. ESCUTADORES DE EVENTOS
// ===============================================

// Abrir/Fechar Sidebar ao clicar no avatar
if (userAvatarWrapper) {
    userAvatarWrapper.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita fechar imediatamente pelo listener do document
        if (userSidebar) userSidebar.classList.toggle('open');
    });
}

// Fechar Sidebar ao clicar fora
document.addEventListener('click', (event) => {
    if (userSidebar && userSidebar.classList.contains('open') && 
        !userSidebar.contains(event.target) && 
        (userAvatarWrapper && !userAvatarWrapper.contains(event.target))) {
        userSidebar.classList.remove('open');
    }
});

// Botão de Sair (podem haver múltiplos IDs se estiver em várias páginas, ou usamos querySelectorAll)
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'logoutBtn') {
        signOutUser();
    }
});

// Botão de Login
if (loginBtn) {
    loginBtn.addEventListener('click', loginWithGoogle);
}

// Lógica para editar username na sidebar
document.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('#edit-username-btn');
    if (!editBtn) return;

    const nameDisplay = document.getElementById('sidebar-name');
    const nameInput = document.getElementById('sidebar-name-input');

    if (nameInput.style.display === 'none') {
        // Entrar em modo de edição
        nameDisplay.style.display = 'none';
        nameInput.style.display = 'block';
        nameInput.value = nameDisplay.textContent;
        nameInput.focus();
        editBtn.textContent = '💾';
    } else {
        // Salvar alterações
        const newName = nameInput.value.trim().substring(0, 20); // Garantir limite no JS
        if (newName && newName !== nameDisplay.textContent) {
            const user = await getCurrentUser();
            if (user) {
                const { error } = await supabase
                    .from('perfis')
                    .update({ username: newName })
                    .eq('id', user.id);

                if (!error) {
                    nameDisplay.textContent = newName;
                    // Atualizar em todo o lado que o nome aparece
                    const sidebarName = document.getElementById('sidebar-name');
                    if (sidebarName) sidebarName.textContent = newName;
                } else {
                    console.error('Erro ao salvar username:', error.message);
                    alert('Erro ao salvar o nome de utilizador.');
                }
            }
        }
        nameDisplay.style.display = 'block';
        nameInput.style.display = 'none';
        editBtn.textContent = '✏️';
    }
});

// Salvar ao pressionar Enter no input de username
document.addEventListener('keydown', (e) => {
    if (e.target.id === 'sidebar-name-input' && e.key === 'Enter') {
        const editBtn = document.getElementById('edit-username-btn');
        if (editBtn) editBtn.click();
    }
});

// ===============================================
// 6. INICIALIZAÇÃO E DETEÇÃO DE SESSÃO
// ===============================================

// Listener de Estado
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`🔔 Evento Supabase: ${event}`);
    
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        updateNavbar();
        
        if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    } else if (event === 'SIGNED_OUT') {
        updateNavbar();
    }
});

// Inicialização
(async function init() {
    console.log("🚀 Auth Script Iniciado.");
    await updateNavbar();
})();
// Lógica para editar bio na sidebar
document.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('#edit-bio-btn');
    if (!editBtn) return;

    const bioDisplay = document.getElementById('sidebar-bio');
    const bioInput = document.getElementById('sidebar-bio-input');

    if (bioInput.style.display === 'none') {
        // Entrar em modo de edição
        bioDisplay.style.display = 'none';
        bioInput.style.display = 'block';
        bioInput.value = bioDisplay.textContent === 'Nenhuma bio definida.' ? '' : bioDisplay.textContent;
        bioInput.focus();
        editBtn.textContent = '💾';
    } else {
        // Salvar alterações
        const newBio = bioInput.value.trim().substring(0, 150); // Garantir limite no JS
        if (newBio !== bioDisplay.textContent) {
            const user = await getCurrentUser();
            if (user) {
                const { error } = await supabase
                    .from('perfis')
                    .update({ bio: newBio || 'Nenhuma bio definida.' })
                    .eq('id', user.id);

                if (!error) {
                    bioDisplay.textContent = newBio || 'Nenhuma bio definida.';
                } else {
                    console.error('Erro ao salvar bio:', error.message);
                    alert('Erro ao salvar a bio.');
                }
            }
        }
        bioDisplay.style.display = 'block';
        bioInput.style.display = 'none';
        editBtn.textContent = '✏️';
    }
});

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