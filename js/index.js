// Página Inicial - Lógica de Autenticação (Atualizada para Flip Login)

document.addEventListener('DOMContentLoaded', async function() {
    // Atualizar navbar ao carregar
    await updateNavbar();

    // Verificar estado inicial de autenticação
    const user = await getCurrentUser();
    const flipContainer = document.getElementById('container');
    const mainContent = document.getElementById('mainContent');

    if (user) {
        // Usuário logado - mostrar conteúdo principal
        if (flipContainer) flipContainer.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    } else {
        // Usuário não logado - mostrar login flip
        if (flipContainer) flipContainer.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
    }

    // Escutar mudanças de autenticação
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            checkAuthState();
        }
    });
});


// Verificar e atualizar estado de autenticação
async function checkAuthState() {
    const user = await getCurrentUser();
    const flipContainer = document.getElementById('container');
    const mainContent = document.getElementById('mainContent');

    if (user) {
        // Usuário logado - mostrar conteúdo principal
        if (flipContainer) flipContainer.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        updateNavbar();
    } else {
        // Usuário não logado - mostrar login
        if (flipContainer) flipContainer.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        updateNavbar();
    }
}

// Redirecionar para página de login
function showLoginModal() {
    window.location.href = 'pages/login.html';
}

// Fazer logout
async function handleLogout() {
    if (!confirm('Tem certeza que deseja sair?')) {
        return;
    }

    const result = await signOutUser();

    if (result.success) {
        alert('✅ Logout realizado com sucesso!');
        await updateNavbar();
        // Recarregar página para mostrar login
        window.location.reload();
    } else {
        alert('❌ Erro ao fazer logout: ' + result.error);
    }
}
