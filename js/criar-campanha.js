// Página de Criar/Editar Campanha

let editingId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const isLoggedIn = await requireLogin();
    if (!isLoggedIn) return;
    
    // Verificar se está editando
    const params = new URLSearchParams(window.location.search);
    editingId = params.get('id');
    
    if (editingId) {
        await loadCampanhaForEditing(editingId);
    }
    
    // Setup event listeners
    document.getElementById('campanhaForm').addEventListener('submit', handleFormSubmit);
});

async function loadCampanhaForEditing(id) {
    try {
        const result = await getCampanhaById(id);
        
        if (!result.success) {
            alert('Erro ao carregar campanha: ' + result.error);
            return;
        }
        
        const campanha = result.data;
        
        // Preencher formulário
        document.getElementById('nome').value = campanha.nome || '';
        document.getElementById('descricao').value = campanha.descricao || '';
        document.getElementById('ativa').checked = campanha.ativa !== false;
        
    } catch (error) {
        console.error('Erro ao carregar campanha:', error);
        alert('Erro ao carregar campanha');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
        alert('Por favor, preencha o nome da campanha!');
        return;
    }
    
    const campanhaData = {
        nome: nome,
        descricao: document.getElementById('descricao').value || null,
        ativa: document.getElementById('ativa').checked
    };
    
    let result;
    
    if (editingId) {
        result = await updateCampanha(editingId, campanhaData);
        if (result.success) {
            alert('Campanha atualizada com sucesso!');
            window.location.href = 'campanhas.html';
        } else {
            alert('Erro ao atualizar campanha: ' + result.error);
        }
    } else {
        result = await createCampanha(campanhaData);
        if (result.success) {
            alert('Campanha criada com sucesso!');
            window.location.href = 'campanhas.html';
        } else {
            alert('Erro ao criar campanha: ' + result.error);
        }
    }
}

async function handleLogout() {
    const result = await signOutUser();
    
    if (result.success) {
        alert('Logout realizado com sucesso!');
        window.location.href = '../index.html';
    } else {
        alert('Erro ao fazer logout: ' + result.error);
    }
}
