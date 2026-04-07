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

        // 1. Pega a foto do Google (user_metadata) inicialmente
        let finalAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2a2a35&color=fff`;

        if (!finalAvatar) finalAvatar = defaultAvatar;

        // 2. Busca dados extras na tabela 'perfis' para ver se há foto customizada
        try {
            const { data: profile, error } = await supabase
                .from('perfis')
                .select('nivel_conta, bio, username, avatar_url, is_admin')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = Not Found
                console.error('Erro ao buscar perfil:', error.message);
            }

            if (profile) {
                window.currentUserProfile = profile; // Permite verificar is_admin em outras páginas
                // PRIORIDADE: Se houver avatar_url no perfil, usamos essa!
                if (profile.avatar_url) finalAvatar = profile.avatar_url;
                
                if (sidebarLevel) sidebarLevel.textContent = profile.nivel_conta || 1;
                if (sidebarBio) sidebarBio.textContent = profile.bio || 'Nenhuma bio definida.';
                if (sidebarName && profile.username) sidebarName.textContent = profile.username;
            } else {
                window.currentUserProfile = { is_admin: false };
                // Se não existir perfil, cria um básico
                await createOrUpdateProfile(user);
            }
        } catch (err) {
            console.error('Erro inesperado ao processar perfil:', err);
        }

        // 3. Aplicar a imagem final (Google ou DB) na UI
        if (profilePic) {
            profilePic.referrerPolicy = "no-referrer";
            profilePic.onerror = () => { profilePic.src = defaultAvatar; };
            profilePic.src = finalAvatar;
        }
        if (sidebarPic) {
            sidebarPic.referrerPolicy = "no-referrer";
            sidebarPic.onerror = () => { sidebarPic.src = defaultAvatar; };
            sidebarPic.src = finalAvatar;
        }
        if (sidebarName && !sidebarName.textContent) sidebarName.textContent = fullName;
        if (sidebarEmail) sidebarEmail.textContent = user.email;

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

// ===============================================
// Lógica de Upload de Avatar Customizado
// ===============================================
const avatarInput = document.createElement('input');
avatarInput.type = 'file';
avatarInput.id = 'avatarUploadInput';
avatarInput.accept = 'image/*';
avatarInput.style.display = 'none';
document.body.appendChild(avatarInput);

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'sidebar-pic') {
        avatarInput.click();
    }
});

// Cursor pointer e hover effect via CSS dinâmico
const avatarStyle = document.createElement('style');
avatarStyle.innerHTML = `
    #sidebar-pic {
        cursor: pointer;
        transition: filter 0.3s, transform 0.3s;
    }
    #sidebar-pic:hover {
        filter: brightness(0.7);
        transform: scale(1.05);
    }
`;
document.head.appendChild(avatarStyle);

// ===============================================
// Funções de Recorte de Imagem (Cropper.js)
// ===============================================
function loadCropperJS() {
    return new Promise((resolve) => {
        if (window.Cropper) return resolve();
        
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
        document.head.appendChild(css);
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

const cropperModal = document.createElement('div');
cropperModal.id = 'authCropperModal';
cropperModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; align-items:center; justify-content:center; flex-direction:column; padding:20px;';
cropperModal.innerHTML = `
    <div style="width:100%; max-width:500px; max-height:80vh; background:#1a2a4e; padding:15px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <div style="height:400px; width:100%; max-height:60vh; background:#000; overflow:hidden;">
            <img id="authCropperImage" src="" style="max-width:100%; display:block;">
        </div>
        <div style="display:flex; justify-content:center; gap:15px; margin-top:20px;">
            <button id="authCropperCancel" style="padding:10px 25px; border-radius:6px; font-weight:600; cursor:pointer; border:none; background:#ff4444; color:white; transition:transform 0.2s;">Cancelar</button>
            <button id="authCropperSave" style="padding:10px 25px; border-radius:6px; font-weight:600; cursor:pointer; border:none; background:#667eea; color:white; transition:transform 0.2s;">Cortar & Salvar</button>
        </div>
    </div>
`;
document.body.appendChild(cropperModal);

let authCropperInstance = null;

avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = await getCurrentUser();
    if (!user) {
        alert('Tens de ter sessão iniciada para alterar a imagem.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        await loadCropperJS();
        
        const imageElement = document.getElementById('authCropperImage');
        imageElement.src = ev.target.result;
        cropperModal.style.display = 'flex';
        
        if (authCropperInstance) {
            authCropperInstance.destroy();
        }
        
        authCropperInstance = new Cropper(imageElement, {
            aspectRatio: 1, // Para manter proporção quadrada
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.9,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    reader.readAsDataURL(file);
});

document.getElementById('authCropperCancel').addEventListener('click', () => {
    cropperModal.style.display = 'none';
    if (authCropperInstance) {
        authCropperInstance.destroy();
        authCropperInstance = null;
    }
    avatarInput.value = '';
});

document.getElementById('authCropperSave').addEventListener('click', async () => {
    if (!authCropperInstance) return;
    
    const user = await getCurrentUser();
    const btnSave = document.getElementById('authCropperSave');
    btnSave.textContent = "A salvar...";
    btnSave.disabled = true;

    const canvas = authCropperInstance.getCroppedCanvas({
        width: 300,
        height: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    canvas.toBlob(async (blob) => {
        const sidebarPic = document.getElementById('sidebar-pic');
        const profilePic = document.getElementById('profile-picture');
        const oldSrc = sidebarPic.src;
        
        cropperModal.style.display = 'none';
        sidebarPic.src = 'https://ui-avatars.com/api/?name=Loading...&background=2a2a35&color=fff';

        try {
            const fileName = `${user.id}_${Date.now()}.jpg`;
            const filePath = `${fileName}`; 

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const newAvatarUrl = publicUrlData.publicUrl;

            const { error: profileError } = await supabase
                .from('perfis')
                .update({ avatar_url: newAvatarUrl })
                .eq('id', user.id);

            if (profileError) throw profileError;

            sidebarPic.src = newAvatarUrl;
            sidebarPic.referrerPolicy = "no-referrer";
            if (profilePic) {
                profilePic.src = newAvatarUrl;
                profilePic.referrerPolicy = "no-referrer";
            }
            
            console.log('Avatar cortado e atualizado com sucesso!');

        } catch (error) {
            console.error('Erro no upload do avatar recortado:', error);
            sidebarPic.src = oldSrc;
            alert('Falha ao atualizar a foto de perfil. Tenta novamente.');
        } finally {
            avatarInput.value = '';
            btnSave.textContent = "Cortar & Salvar";
            btnSave.disabled = false;
            
            if (authCropperInstance) {
                authCropperInstance.destroy();
                authCropperInstance = null;
            }
        }
    }, 'image/jpeg', 0.9);
});

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