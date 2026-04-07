/**
 * admin.js - Lógica do Painel Administrativo
 */

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        // 1. Verificar se o utilizador está logado e é admin
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = '../index.html';
            return;
        }

        // Aguardar o perfil ser carregado pelo auth.js (que define window.currentUserProfile)
        // Ou buscar manualmente para garantir
        const { data: profile, error: profileError } = await supabase
            .from('perfis')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile || !profile.is_admin) {
            await showConfirmDialog('Acesso negado. Apenas administradores podem aceder a esta página.', { confirmText: 'OK', cancelText: 'Sair' });
            window.location.href = '../index.html';
            return;
        }

        // Se for admin, remove o overlay e carrega os dados
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        loadUsers();
        loadChapters();

    } catch (err) {
        console.error('Erro na verificação de admin:', err);
        window.location.href = '../index.html';
    }

    // --- EVENT LISTENERS ---
    
    // Pesquisa de utilizadores
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#userListBody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // Filtro de abas nos capítulos
    const chapterFilter = document.getElementById('chapterFilterAba');
    if (chapterFilter) {
        chapterFilter.addEventListener('change', () => loadChapters());
    }

    // Abrir modal de novo capítulo
    const addChapterBtn = document.getElementById('addChapterBtn');
    if (addChapterBtn) {
        addChapterBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Novo Capítulo';
            document.getElementById('editOriginalSlug').value = '';
            document.getElementById('chapterForm').reset();
            const modal = new bootstrap.Modal(document.getElementById('chapterModal'));
            modal.show();
        });
    }

    // Salvar capítulo
    const saveChapterBtn = document.getElementById('saveChapterBtn');
    if (saveChapterBtn) {
        saveChapterBtn.addEventListener('click', saveChapter);
    }
});

// --- FUNÇÕES DE UTILIZADORES ---

async function loadUsers() {
    const userListBody = document.getElementById('userListBody');
    if (!userListBody) return;

    userListBody.innerHTML = '<tr><td colspan="4" class="text-center">Carregando utilizadores...</td></tr>';

    const { data: users, error } = await supabase
        .from('perfis')
        .select('*')
        .order('username');

    if (error) {
        console.error('Erro ao listar utilizadores:', error);
        userListBody.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Erro ao carregar dados.</td></tr>';
        return;
    }

    userListBody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');
        const isAdmin = user.is_admin;
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${user.avatar_url || 'https://ui-avatars.com/api/?name='+user.username}" class="user-avatar">
                    <span>${user.username}</span>
                </div>
            </td>
            <td>${user.id.substring(0, 8)}...</td>
            <td>
                <span class="badge ${isAdmin ? 'badge-admin' : 'bg-secondary'}">
                    ${isAdmin ? 'ADMIN' : 'Membro'}
                </span>
            </td>
            <td>
                <button class="btn ${isAdmin ? 'btn-outline-danger' : 'btn-outline-primary'} btn-action" 
                    onclick="toggleAdmin('${user.id}', ${isAdmin})">
                    ${isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                </button>
            </td>
        `;
        userListBody.appendChild(row);
    });
}

async function toggleAdmin(userId, currentStatus) {
    const action = currentStatus ? 'remover' : 'tornar';
    const confirmed = await showConfirmDialog(`Tens a certeza que queres ${action} este utilizador admin?`, {
        confirmText: 'Sim, aplicar',
        cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    const { error } = await supabase
        .from('perfis')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

    if (error) {
        showConfirmDialog('Erro ao atualizar cargo: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    } else {
        loadUsers();
    }
}

// --- FUNÇÕES DE CAPÍTULOS ---

async function loadChapters() {
    const chapterListBody = document.getElementById('chapterListBody');
    const filterAba = document.getElementById('chapterFilterAba').value;
    
    if (!chapterListBody) return;

    chapterListBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando capítulos...</td></tr>';

    let query = supabase.from('capitulos_sistema').select('*').order('ordem');
    
    if (filterAba !== 'all') {
        query = query.eq('aba', filterAba);
    }

    const { data: chapters, error } = await query;

    if (error) {
        console.error('Erro ao listar capítulos:', error);
        chapterListBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Erro ao carregar capítulos.</td></tr>';
        return;
    }

    chapterListBody.innerHTML = '';
    chapters.forEach(chap => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold">${chap.ordem}</td>
            <td>${chap.titulo}</td>
            <td><code>${chap.slug}</code></td>
            <td><span class="badge bg-dark">${chap.aba}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info me-2" onclick="editChapter('${chap.slug}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteChapter('${chap.slug}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        chapterListBody.appendChild(row);
    });
}

async function editChapter(slug) {
    const { data: chap, error } = await supabase
        .from('capitulos_sistema')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        showConfirmDialog('Erro ao carregar capítulo: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
        return;
    }

    document.getElementById('modalTitle').textContent = 'Editar Capítulo';
    document.getElementById('editOriginalSlug').value = chap.slug;
    document.getElementById('chapterTitle').value = chap.titulo;
    document.getElementById('chapterSlug').value = chap.slug;
    document.getElementById('chapterAba').value = chap.aba;
    document.getElementById('chapterOrder').value = chap.ordem;
    document.getElementById('chapterContent').value = chap.conteudo;

    const modal = new bootstrap.Modal(document.getElementById('chapterModal'));
    modal.show();
}

async function saveChapter() {
    const originalSlug = document.getElementById('editOriginalSlug').value;
    const chapData = {
        titulo: document.getElementById('chapterTitle').value,
        slug: document.getElementById('chapterSlug').value,
        aba: document.getElementById('chapterAba').value,
        ordem: parseInt(document.getElementById('chapterOrder').value),
        conteudo: document.getElementById('chapterContent').value
    };

    if (!chapData.titulo || !chapData.slug || !chapData.conteudo) {
        showConfirmDialog('Preenche todos os campos obrigatórios.', { confirmText: 'OK', cancelText: 'Fechar' });
        return;
    }

    let result;
    if (originalSlug) {
        // Update
        result = await supabase
            .from('capitulos_sistema')
            .update(chapData)
            .eq('slug', originalSlug);
    } else {
        // Insert
        result = await supabase
            .from('capitulos_sistema')
            .insert(chapData);
    }

    if (result.error) {
        showConfirmDialog('Erro ao salvar: ' + result.error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    } else {
        const modalElement = document.getElementById('chapterModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        loadChapters();
    }
}

async function deleteChapter(slug) {
    const confirmed = await showConfirmDialog('Tens a certeza que queres eliminar este capítulo? Esta ação é irreversível.', {
        confirmText: 'Sim, eliminar',
        cancelText: 'Anular'
    });

    if (!confirmed) return;

    const { error } = await supabase
        .from('capitulos_sistema')
        .delete()
        .eq('slug', slug);

    if (error) {
        showConfirmDialog('Erro ao eliminar: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    } else {
        loadChapters();
    }
}

// Tornar funções globais para usar em onclick nos templates literais
window.toggleAdmin = toggleAdmin;
window.editChapter = editChapter;
window.deleteChapter = deleteChapter;
