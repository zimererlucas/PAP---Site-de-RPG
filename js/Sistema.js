// Sistema.js - Carregamento dinâmico de capítulos do sistema

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Sistema Rulebook: Carregando conteúdos dinâmicos...');
    await initDynamicTabs();
});

/**
 * Identifica todas as abas existentes na BD (tabela abas_sistema) e cria a estrutura da UI
 */
async function initDynamicTabs() {
    try {
        const { data: abas, error } = await supabase
            .from('abas_sistema')
            .select('*')
            .is('deleted_at', null)
            .order('ordem');

        if (error) throw error;

        const tabsNav = document.getElementById('systemTabs');
        const tabsContent = document.getElementById('systemTabsContent');

        if (!tabsNav || !tabsContent) return;

        tabsNav.innerHTML = '';
        tabsContent.innerHTML = '';

        if (!abas || abas.length === 0) {
            tabsContent.innerHTML = '<div class="text-center py-5 text-white-50">Nenhuma secção disponível no momento.</div>';
            return;
        }

        for (let i = 0; i < abas.length; i++) {
            const aba = abas[i];
            const isFirst = i === 0;
            const tabId = `${aba.slug}-tab`;
            const contentId = `${aba.slug}-content`;
            const navId = `${aba.slug}-sidebar-nav`;
            const mainContentId = `${aba.slug}-main-content`;

            // 1. Criar Botão da Aba
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            navItem.setAttribute('role', 'presentation');
            navItem.innerHTML = `
                <button class="nav-link ${isFirst ? 'active' : ''}" id="${tabId}" data-bs-toggle="pill" data-bs-target="#${contentId}"
                    type="button" role="tab">
                    <i class="bi ${aba.icone} me-1"></i> ${aba.titulo}
                </button>
            `;
            tabsNav.appendChild(navItem);

            // 2. Criar Pane de Conteúdo
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane fade ${isFirst ? 'show active' : ''}`;
            tabPane.id = contentId;
            tabPane.setAttribute('role', 'tabpanel');
            tabPane.innerHTML = `
                <div class="reader-layout">
                    <aside class="reader-sidebar glass-card">
                        <div class="sidebar-title"><i class="bi ${aba.icone} me-2"></i> ${aba.titulo}</div>
                        <ul class="sidebar-nav" id="${navId}">
                            <div class="text-center py-4 text-white-50 spinner-border text-primary" role="status"></div>
                        </ul>
                    </aside>
                    <main class="reader-content glass-card" id="${mainContentId}">
                        <div class="text-center py-5 text-white-50">Carregando conteúdo...</div>
                    </main>
                </div>
            `;
            tabsContent.appendChild(tabPane);

            // 3. Carregar Capítulos para esta aba
            await loadChapters(aba.slug, navId, mainContentId);
        }

        // Inicializa a navegação após criar todas as abas
        setupNavigation();

    } catch (err) {
        console.error('Erro ao inicializar abas dinâmicas:', err);
    }
}

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

        // Agrupar capítulos por categoria
        const grouped = {};
        chapters.forEach(chap => {
            const cat = chap.categoria || 'Geral';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(chap);
        });

        let isFirst = true;

        Object.keys(grouped).forEach((catName, groupIndex) => {
            const groupId = `${aba}-group-${groupIndex}`;
            
            // 1. Adicionar Cabeçalho de Categoria (se não for a única 'Geral')
            if (catName !== 'Geral' || Object.keys(grouped).length > 1) {
                const header = document.createElement('li');
                header.className = 'sidebar-category';
                header.setAttribute('data-bs-toggle', 'collapse');
                header.setAttribute('data-bs-target', `#${groupId}`);
                header.setAttribute('aria-expanded', 'true');
                header.innerHTML = `
                    <i class="bi bi-globe"></i> 
                    <span>${catName}</span>
                    <i class="bi bi-chevron-down chevron"></i>
                `;
                navElement.appendChild(header);

                // Criar container para os itens colapsáveis
                const container = document.createElement('div');
                container.id = groupId;
                container.className = 'collapse show category-container';
                navElement.appendChild(container);

                // Adicionar capítulos dentro do container
                grouped[catName].forEach(chap => {
                    renderChapter(chap, container);
                });
            } else {
                // Se for apenas 'Geral', renderizar diretamente no navElement
                grouped[catName].forEach(chap => {
                    renderChapter(chap, navElement);
                });
            }
        });

        function renderChapter(chap, parent) {
            const isActive = isFirst;
            if (isFirst) isFirst = false;

            // Link na sidebar
            const li = document.createElement('li');
            li.className = 'sidebar-item';
            li.innerHTML = `
                <a href="#${chap.slug}" class="sidebar-link ${isActive ? 'active' : ''}" data-section="${chap.slug}">
                    ${chap.titulo}
                </a>
            `;
            parent.appendChild(li);

            // Secção de conteúdo
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
        }

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
