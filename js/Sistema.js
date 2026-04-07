// Sistema.js - Carregamento dinâmico de capítulos do sistema

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Sistema Rulebook: Carregando conteúdos...');
    
    await loadChapters('rules', 'rules-sidebar-nav', 'rules-main-content');
    await loadChapters('continents', 'continents-sidebar-nav', 'continents-main-content');

    // Inicializa a lógica de navegação após carregar o conteúdo
    setupNavigation();
});

/**
 * Procura capítulos na BD filtrando por aba e renderiza na UI
 */
async function loadChapters(aba, navId, contentId) {
    const navElement = document.getElementById(navId);
    const contentElement = document.getElementById(contentId);

    if (!navElement || !contentElement) return;

    try {
        const { data: chapters, error } = await supabase
            .from('capitulos_sistema')
            .select('*')
            .eq('aba', aba)
            .order('ordem', { ascending: true });

        if (error) throw error;

        if (!chapters || chapters.length === 0) {
            navElement.innerHTML = '<li class="text-white-50 p-3">Nenhum capítulo encontrado.</li>';
            contentElement.innerHTML = '<div class="text-center py-5 text-white-50">Conteúdo ainda não disponível para esta secção.</div>';
            return;
        }

        // Limpar placeholders
        navElement.innerHTML = '';
        contentElement.innerHTML = '';

        chapters.forEach((chap, index) => {
            const isActive = index === 0;

            // 1. Criar link na sidebar
            const li = document.createElement('li');
            li.className = 'sidebar-item';
            li.innerHTML = `
                <a href="#${chap.slug}" class="sidebar-link ${isActive ? 'active' : ''}" data-section="${chap.slug}">
                    ${chap.titulo}
                </a>
            `;
            navElement.appendChild(li);

            // 2. Criar secção de conteúdo
            const section = document.createElement('div');
            section.id = chap.slug;
            section.className = `rule-section ${isActive ? 'active' : ''}`;
            section.innerHTML = `
                <h2 class="rule-title">${chap.titulo}</h2>
                <div class="rule-text">
                    ${chap.conteudo}
                </div>
            `;
            contentElement.appendChild(section);
        });

    } catch (err) {
        console.error(`Erro ao carregar capítulos (${aba}):`, err.message);
        navElement.innerHTML = '<li class="text-danger p-3">Erro ao carregar.</li>';
        contentElement.innerHTML = '<div class="text-danger py-5">Falha ao ligar à base de dados. Verifica a tua ligação.</div>';
    }
}

/**
 * Configura a troca de abas e secções (lógica que já existia mas adaptada)
 */
function setupNavigation() {
    const layouts = document.querySelectorAll('.reader-layout');

    layouts.forEach(layout => {
        // Usamos delegação de eventos para links criados dinamicamente
        layout.addEventListener('click', (e) => {
            const link = e.target.closest('.sidebar-link');
            if (!link) return;

            e.preventDefault();
            const targetId = link.getAttribute('data-section');
            const sidebarLinks = layout.querySelectorAll('.sidebar-link');
            const sections = layout.querySelectorAll('.rule-section');

            // Update active link ONLY within this layout
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target section, hide others ONLY within this layout
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    // Scroll to top of content area on mobile
                    if (window.innerWidth < 992) {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}
