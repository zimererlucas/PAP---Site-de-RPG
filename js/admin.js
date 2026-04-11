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

    // --- GESTÃO DE ABAS ---
    let showTrash = false;
    const toggleTrashBtn = document.getElementById('toggleTrashBtn');
    if (toggleTrashBtn) {
        toggleTrashBtn.addEventListener('click', () => {
            showTrash = !showTrash;
            toggleTrashBtn.innerHTML = showTrash ? '<i class="bi bi-list-task me-2"></i> Ver Ativas' : '<i class="bi bi-trash3 me-2"></i> Ver Lixeira';
            toggleTrashBtn.classList.toggle('btn-outline-warning', !showTrash);
            toggleTrashBtn.classList.toggle('btn-outline-info', showTrash);
            loadAbas(showTrash);
        });
    }

    const addAbaBtn = document.getElementById('addAbaBtn');
    if (addAbaBtn) {
        addAbaBtn.addEventListener('click', () => {
            document.getElementById('abaModalTitle').textContent = 'Nova Aba';
            document.getElementById('abaEditMode').value = 'false';
            document.getElementById('abaForm').reset();
            document.getElementById('abaSlug').disabled = false;
            document.getElementById('abaIconPreview').className = 'bi bi-bookmark';
            const modal = new bootstrap.Modal(document.getElementById('abaModal'));
            modal.show();
        });
    }

    const abaIconInput = document.getElementById('abaIcon');
    if (abaIconInput) {
        abaIconInput.addEventListener('input', (e) => {
            const preview = document.getElementById('abaIconPreview');
            preview.className = `bi ${e.target.value.trim() || 'bi-bookmark'}`;
        });
    }

    const abaTitleInput = document.getElementById('abaTitle');
    if (abaTitleInput) {
        abaTitleInput.addEventListener('input', (e) => {
            if (document.getElementById('abaEditMode').value === 'false') {
                const slug = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                document.getElementById('abaSlug').value = slug;
            }
        });
    }

    const saveAbaBtn = document.getElementById('saveAbaBtn');
    if (saveAbaBtn) {
        saveAbaBtn.addEventListener('click', saveAba);
    }

    // --- GESTÃO DE CAPÍTULOS ---
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

    const saveChapterBtn = document.getElementById('saveChapterBtn');
    if (saveChapterBtn) {
        saveChapterBtn.addEventListener('click', saveChapter);
    }

    // Carregar dados iniciais e limpar lixeira
    cleanupTrash();
    loadUsers();
    loadAbas();
    loadChapters();
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

// --- FUNÇÕES DE ABAS ---

async function loadAbas(showTrash = false) {
    const abaListBody = document.getElementById('abaListBody');
    if (!abaListBody) return;

    abaListBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando abas...</td></tr>';

    let query = supabase.from('abas_sistema').select('*').order('ordem');
    
    if (showTrash) {
        query = query.not('deleted_at', 'is', null);
    } else {
        query = query.is('deleted_at', null);
    }

    const { data: abas, error } = await query;

    if (error) {
        console.error('Erro ao listar abas:', error);
        abaListBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Erro ao carregar abas.</td></tr>';
        return;
    }

    abaListBody.innerHTML = '';
    abas.forEach((aba, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold">${aba.ordem}</td>
            <td>${aba.titulo}</td>
            <td><code>${aba.slug}</code></td>
            <td><i class="bi ${aba.icone}"></i></td>
            <td>
                ${!showTrash ? `
                    <button class="btn btn-sm btn-outline-light me-1" onclick="moveAba('${aba.slug}', -1)" ${index === 0 ? 'disabled' : ''}>
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-light me-1" onclick="moveAba('${aba.slug}', 1)" ${index === abas.length - 1 ? 'disabled' : ''}>
                        <i class="bi bi-arrow-down"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info me-1" onclick="editAba('${aba.slug}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAba('${aba.slug}')">
                        <i class="bi bi-trash"></i>
                    </button>
                ` : `
                    <button class="btn btn-sm btn-success me-1" onclick="restoreAba('${aba.slug}')">
                        <i class="bi bi-arrow-counterclockwise"></i> Restaurar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="hardDeleteAba('${aba.slug}')">
                        <i class="bi bi-x-circle"></i>
                    </button>
                `}
            </td>
        `;
        abaListBody.appendChild(row);
    });
}

async function saveAba() {
    const isEdit = document.getElementById('abaEditMode').value === 'true';
    const slug = document.getElementById('abaSlug').value;
    const abaData = {
        titulo: document.getElementById('abaTitle').value,
        icone: document.getElementById('abaIcon').value || 'bi-bookmark',
        ordem: parseInt(document.getElementById('abaOrder').value) || 0
    };

    if (!isEdit) {
        abaData.slug = slug;
    }

    const { error } = isEdit 
        ? await supabase.from('abas_sistema').update(abaData).eq('slug', slug)
        : await supabase.from('abas_sistema').insert(abaData);

    if (error) {
        showConfirmDialog('Erro ao salvar aba: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    } else {
        const modal = bootstrap.Modal.getInstance(document.getElementById('abaModal'));
        modal.hide();
        loadAbas();
        // Atualizar filtros e sugestões
        loadChapters();
    }
}

async function editAba(slug) {
    const { data: aba, error } = await supabase.from('abas_sistema').select('*').eq('slug', slug).single();
    if (error) return;

    document.getElementById('abaModalTitle').textContent = 'Editar Aba';
    document.getElementById('abaEditMode').value = 'true';
    document.getElementById('abaTitle').value = aba.titulo;
    document.getElementById('abaSlug').value = aba.slug;
    document.getElementById('abaSlug').disabled = true;
    document.getElementById('abaIcon').value = aba.icone;
    document.getElementById('abaIconPreview').className = `bi ${aba.icone}`;
    document.getElementById('abaOrder').value = aba.ordem;

    const modal = new bootstrap.Modal(document.getElementById('abaModal'));
    modal.show();
}

async function moveAba(slug, direction) {
    const { data: abas } = await supabase.from('abas_sistema').select('slug, ordem').is('deleted_at', null).order('ordem');
    const idx = abas.findIndex(a => a.slug === slug);
    if (idx === -1) return;

    const otherIdx = idx + direction;
    if (otherIdx < 0 || otherIdx >= abas.length) return;

    const currentAba = abas[idx];
    const otherAba = abas[otherIdx];

    const tempOrdem = currentAba.ordem;
    await supabase.from('abas_sistema').update({ ordem: otherAba.ordem }).eq('slug', currentAba.slug);
    await supabase.from('abas_sistema').update({ ordem: tempOrdem }).eq('slug', otherAba.slug);

    loadAbas();
}

async function deleteAba(slug) {
    const confirmed = await showConfirmDialog('Tens a certeza que queres mover esta aba para a lixeira?', {
        confirmText: 'Mover para Lixeira',
        cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    const { error } = await supabase.from('abas_sistema').update({ deleted_at: new Date() }).eq('slug', slug);
    if (error) showConfirmDialog('Erro ao apagar: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    else loadAbas();
}

async function restoreAba(slug) {
    const { error } = await supabase.from('abas_sistema').update({ deleted_at: null }).eq('slug', slug);
    if (error) showConfirmDialog('Erro ao restaurar: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    else loadAbas(true);
}

async function hardDeleteAba(slug) {
    const confirmed = await showConfirmDialog('Isto apagará a aba permanentemente. Tens a certeza?', {
        confirmText: 'Apagar Definitivamente',
        cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    const { error } = await supabase.from('abas_sistema').delete().eq('slug', slug);
    if (error) showConfirmDialog('Erro ao apagar permanentemente: ' + error.message, { confirmText: 'OK', cancelText: 'Fechar' });
    else loadAbas(true);
}

async function cleanupTrash() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error } = await supabase.from('abas_sistema').delete().lt('deleted_at', thirtyDaysAgo.toISOString());
    if (error) console.error('Erro na limpeza automática da lixeira:', error);
}

// --- FUNÇÕES DE CAPÍTULOS ---

async function loadChapters() {
    const chapterListBody = document.getElementById('chapterListBody');
    const chapterFilter = document.getElementById('chapterFilterAba');
    const filterAba = chapterFilter ? chapterFilter.value : 'all';
    
    if (!chapterListBody) return;

    chapterListBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando capítulos...</td></tr>';

    // 1. Carregar Abas para popular filtros e sugestões
    const { data: abas, error: abasErr } = await supabase
        .from('abas_sistema')
        .select('*')
        .is('deleted_at', null)
        .order('ordem');

    if (!abasErr && chapterFilter) {
        const currentFilter = chapterFilter.value;
        let filterHTML = '<option value="all">Todas as Abas</option>';
        abas.forEach(aba => {
            filterHTML += `<option value="${aba.slug}" ${currentFilter === aba.slug ? 'selected' : ''}>${aba.titulo}</option>`;
        });
        chapterFilter.innerHTML = filterHTML;

        const datalist = document.getElementById('abaSuggestions');
        if (datalist) {
            datalist.innerHTML = abas.map(a => `<option value="${a.slug}">${a.titulo}</option>`).join('');
        }
    }

    // 2. Carregar Capítulos
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
            <td><span class="badge bg-secondary">${chap.categoria || '-'}</span></td>
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
    document.getElementById('chapterCategory').value = chap.categoria || '';
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
        categoria: document.getElementById('chapterCategory').value || null,
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
window.editAba = editAba;
window.deleteAba = deleteAba;
window.moveAba = moveAba;
window.restoreAba = restoreAba;
window.hardDeleteAba = hardDeleteAba;
