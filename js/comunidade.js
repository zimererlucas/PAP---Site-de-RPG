// ================================================================
// COMUNIDADE.JS — Sistema de Comunidade · Projeto Gênesis
// ================================================================

// ─── Estado Global ────────────────────────────────────────────
const POSTS_PER_PAGE = 20;
let feedOrdem = 'score_desc';       // score_desc | score_asc | recentes
let feedCategoriaFiltro = '';       // '' | 'homebrew' | 'personagem' | 'mundo' | 'narrativa' | 'outro'
let feedSearchDebounce = null;
let feedOffset = 0;
let feedEsgotado = false;
let feedCarregando = false;
let postAtualId = null;
let currentUser = null;
let userVotes = {};
let userCommentVotes = {};
let isVoting = {};
let isAdmin = false;
let isEditingPost = false;
let postEmEdicaoId = null;
let fichasDoUser = [];
let campanhasDoUser = [];

// ─── Tipos de post ─────────────────────────────────────────────
const TIPOS = {
    homebrew: { label: 'Homebrew', cor: '#f59e0b', emoji: '⚗️' },
    personagem: { label: 'Personagem', cor: '#8b5cf6', emoji: '🧙' },
    mundo: { label: 'Mundo', cor: '#10b981', emoji: '🌍' },
    narrativa: { label: 'Narrativa', cor: '#3b82f6', emoji: '📖' },
    outro: { label: 'Outro', cor: '#6b7280', emoji: '💬' }
};

// ================================================================
// 1. INICIALIZAÇÃO
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Determinar utilizador logado (pode ser null — página é pública)
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
    } catch { }

    // Mostrar botão "Publicar" e área de comentários só se logado
    if (currentUser) {
        const btn = document.getElementById('btnPublicar');
        if (btn) btn.style.display = 'inline-flex';

        // Verificar se é admin
        const { data: profile } = await supabase
            .from('perfis')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();
        isAdmin = profile?.is_admin || false;
    }



    // Carregar votos do utilizador (para saber quais já votou)
    if (currentUser) {
        await carregarVotosDoUser();
    }

    // Carregar destaques e feed inicial
    await carregarEstatisticas();
    await carregarDestaques();
    await carregarFeed(true);

    // Inicializar Tempo-Real
    initRealtime();

    // Infinite scroll via IntersectionObserver
    const sentinel = document.getElementById('scrollSentinel');
    if (sentinel) {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !feedCarregando && !feedEsgotado) {
                carregarFeed(false);
            }
        }, { rootMargin: '200px' });
        observer.observe(sentinel);
    }

    const feedSearch = document.getElementById('feedSearch');
    const feedTipoSel = document.getElementById('feedTipoFiltro');
    if (feedSearch) {
        feedSearch.addEventListener('input', () => {
            clearTimeout(feedSearchDebounce);
            feedSearchDebounce = setTimeout(() => carregarFeed(true), 380);
        });
    }
    feedTipoSel?.addEventListener('change', () => carregarFeed(true));

    // Fechar modais ao clicar no overlay
    document.getElementById('modalDetalhePost')?.addEventListener('click', e => { if (e.target.id === 'modalDetalhePost') fecharModalDetalhe(); });

    // Tecla Escape fecha modais
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { fecharModalDetalhe(); }
    });
});

// ================================================================
// 2. CARREGAR VOTOS DO UTILIZADOR
// ================================================================
async function carregarVotosDoUser() {
    if (!currentUser) return;
    try {
        // Votos em POSTS
        const { data, error } = await supabase
            .from('votos_posts')
            .select('post_id, tipo_voto')
            .eq('user_id', currentUser.id);
        if (!error && data) {
            userVotes = {};
            data.forEach(v => { userVotes[v.post_id] = v.tipo_voto; });
        }

        // Votos em COMENTÁRIOS
        const { data: dataC, error: errorC } = await supabase
            .from('votos_comentarios')
            .select('comentario_id, tipo_voto')
            .eq('user_id', currentUser.id);
        if (!errorC && dataC) {
            userCommentVotes = {};
            dataC.forEach(v => { userCommentVotes[v.comentario_id] = v.tipo_voto; });
        }
    } catch (e) { console.warn('Erro ao carregar votos:', e); }
}

// ================================================================
// 3. DESTAQUES AUTOMÁTICOS (calculados no cliente)
// ================================================================
async function carregarDestaques() {
    try {
        const agora = new Date();
        const umaSemana = new Date(agora - 7 * 24 * 3600 * 1000);
        const umMes = new Date(agora - 30 * 24 * 3600 * 1000);

        // Busca posts com score >= 1 criados nos últimos 30 dias
        const { data, error } = await supabase
            .from('posts')
            .select(`
                id, titulo, tipo, score, criado_em, user_id,
                perfis:user_id ( username, avatar_url ),
                comentarios_posts ( count )
            `)
            .gte('score', 1)
            .gte('criado_em', umMes.toISOString())
            .order('score', { ascending: false })
            .limit(20);

        if (error || !data || data.length === 0) return;

        // Classificar em semana / mês
        const listaSemana = data.filter(p => new Date(p.criado_em) >= umaSemana).slice(0, 5);
        const listaMes = data.slice(0, 5);

        renderDestaquesDuplos(listaSemana, listaMes);
    } catch (err) {
        console.warn('Destaques:', err);
    }
}

function renderRowDestaque(post, index) {
    return `
        <div class="destaque-item" onclick="navegarParaTopico('${post.id}')">
            <div class="destaque-rank">#${index + 1}</div>
            <div class="destaque-info">
                <div class="destaque-titulo">${escapeHtml(post.titulo)}</div>
                <div class="destaque-meta">por ${escapeHtml(post.perfis?.username || 'Utilizador')}</div>
            </div>
            <div class="destaque-score-badge">▲ ${post.score}</div>
        </div>
    `;
}

function renderDestaquesDuplos(semana, mes) {
    const section = document.getElementById('destaquesSection');
    const mesSection = document.getElementById('destaqueMesSection');

    const rootSemana = document.getElementById('destaqueSemanaList');
    const rootMes = document.getElementById('destaqueMesList');

    if (semana.length > 0) {
        section.style.display = '';
        rootSemana.innerHTML = semana.map((p, i) => renderRowDestaque(p, i)).join('');
    }
    if (mes.length > 0) {
        mesSection.style.display = '';
        rootMes.innerHTML = mes.map((p, i) => renderRowDestaque(p, i)).join('');
    }
}

// ================================================================
// 4. CARREGAR FEED
// ================================================================
async function carregarFeed(reset = false) {
    if (feedCarregando) return;
    if (document.getElementById('modeFeed')?.hidden) return;

    if (reset) {
        feedOffset = 0;
        feedEsgotado = false;
        // Limpar cards existentes (preservar loading e empty)
        document.querySelectorAll('#postsFeed .thread-row').forEach(el => el.remove());
        document.getElementById('feedLoading').style.display = '';
        document.getElementById('feedEmpty').style.display = 'none';
        document.getElementById('scrollSentinel').style.display = 'none';
    }

    feedCarregando = true;

    try {
        const tipoFiltro = feedCategoriaFiltro;
        const searchRaw = document.getElementById('feedSearch')?.value || '';

        let query = supabase
            .from('posts')
            .select(`
                id, tipo, titulo, conteudo, score, criado_em, user_id,
                personagem_id, campanha_id,
                perfis:user_id ( username, avatar_url ),
                personagens ( nome, raca, nivel ),
                campanhas ( nome ),
                comentarios_posts ( count )
            `);

        if (tipoFiltro) {
            query = query.eq('tipo', tipoFiltro);
        }

        const pattern = buildIlikePattern(searchRaw);
        if (pattern) {
            const quoted = quotePostgrestFilterValue(pattern);
            query = query.or(`titulo.ilike.${quoted},conteudo.ilike.${quoted}`);
        }

        if (feedOrdem === 'recentes') {
            query = query.order('criado_em', { ascending: false });
        } else {
            const scoreAsc = feedOrdem === 'score_asc';
            query = query
                .order('score', { ascending: scoreAsc })
                .order('criado_em', { ascending: false });
        }

        query = query.range(feedOffset, feedOffset + POSTS_PER_PAGE - 1);

        const { data, error } = await query;

        document.getElementById('feedLoading').style.display = 'none';

        if (error) throw error;

        const posts = data || [];

        if (posts.length === 0 && feedOffset === 0) {
            const emptyEl = document.getElementById('feedEmpty');
            emptyEl.style.display = '';
            const hasFilters = Boolean(tipoFiltro || buildIlikePattern(searchRaw));
            const h3 = emptyEl.querySelector('h3');
            const p = emptyEl.querySelector('p');
            if (h3 && p) {
                if (hasFilters) {
                    h3.textContent = 'Nenhum resultado';
                    p.textContent = 'Ajusta a pesquisa ou o filtro de tipo.';
                } else {
                    h3.textContent = 'Nenhum post ainda';
                    p.textContent = 'Sê o primeiro a partilhar conteúdo com a comunidade!';
                }
            }
            document.getElementById('scrollSentinel').style.display = 'none';
            return;
        }

        if (posts.length < POSTS_PER_PAGE) {
            feedEsgotado = true;
            document.getElementById('scrollSentinel').style.display = 'none';
        } else {
            document.getElementById('scrollSentinel').style.display = '';
        }

        const feed = document.getElementById('postsFeed');
        posts.forEach(p => {
            const card = criarCardPost(p);
            feed.appendChild(card);
        });

        feedOffset += posts.length;

    } catch (err) {
        console.error('Erro ao carregar feed:', err);
        document.getElementById('feedLoading').style.display = 'none';
        mostrarToast('Erro ao carregar posts.', 'error');
    } finally {
        feedCarregando = false;
    }
}

/** Normaliza texto de pesquisa e devolve padrão ilike ou null */
function buildIlikePattern(raw) {
    if (typeof raw !== 'string') return null;
    const t = raw.replace(/[%_\\]/g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    return `%${t}%`;
}

/** Valor entre aspas para filtros PostgREST (evita ambiguidade com vírgulas / caracteres especiais) */
function quotePostgrestFilterValue(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

function stripMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/!\[.*?\]\(.*?\)/g, '') // remove imagens
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links ficam só com o texto
        .replace(/[#*`~>_-]/g, '') // remove formatações simples
        .trim();
}

// ================================================================
// 5. RENDERIZAR LINHA DE TÓPICO (layout fórum)
// ================================================================
function criarCardPost(post) {
    const div = document.createElement('div');
    div.className = 'thread-row';
    div.dataset.postId = post.id;

    const tipo = TIPOS[post.tipo] || TIPOS.outro;
    const nomeUser = escapeHtml(post.perfis?.username || 'Utilizador');
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
    const avatar = post.perfis?.avatar_url || defaultAvatar;
    const data = formatarData(post.criado_em);
    const totalComentarios = post.comentarios_posts?.[0]?.count || 0;
    const scoreClass = post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : '';

    const isOwner = currentUser && post.user_id === currentUser.id;
    const canDelete = isOwner || isAdmin;
    const canEdit = isOwner;

    let actionsHtml = '';
    if (canDelete || canEdit) {
        actionsHtml = `
        <div class="thread-actions-wrapper">
            <button class="btn-actions-toggle" onclick="toggleActionsMenu(event, 'post-${post.id}')">⋮</button>
            <div id="actions-post-${post.id}" class="actions-menu">
                ${canEdit ? `<button class="action-item" onclick="editPost('${post.id}', event)"><span>✏️</span> Editar</button>` : ''}
                ${canDelete ? `<button class="action-item delete" onclick="deletePost('${post.id}', event)"><span>🗑️</span> Apagar</button>` : ''}
            </div>
        </div>`;
    }

    div.style.setProperty('--tipo-color', tipo.cor);
    div.innerHTML = `
        ${actionsHtml}
        <div class="thread-topic-col" onclick="if(event.target.closest('.user-link')) return; navegarParaTopico('${post.id}')">
            <a href="perfil.html?id=${post.user_id}" class="user-link"><img class="thread-avatar" src="${avatar}" alt="${nomeUser}" onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer"></a>
            <div class="thread-topic-info">
                <div class="thread-title">
                    <span class="thread-tipo-tag tipo-${post.tipo}">${tipo.emoji} ${tipo.label}</span>
                    ${escapeHtml(post.titulo)}
                </div>
                <div class="thread-excerpt">${escapeHtml(stripMarkdown(post.conteudo))}</div>
                <div class="thread-meta">
                    <span>por <a href="perfil.html?id=${post.user_id}" class="user-link" style="color:white;text-decoration:none;"><strong>${nomeUser}</strong></a></span>
                    <span>·</span>
                    <span>${data}</span>
                </div>
            </div>
        </div>
        <div class="thread-stat-col" onclick="navegarParaTopico('${post.id}')">
            <span class="thread-stat-value ${scoreClass} score-val-${post.id}" id="score-${post.id}">▲ ${post.score}</span>
        </div>
        <div class="thread-stat-col" onclick="navegarParaTopico('${post.id}')">
            <span class="thread-stat-value">${totalComentarios}</span>
            <span class="thread-stat-label">respostas</span>
        </div>
        <div class="thread-activity-col" onclick="navegarParaTopico('${post.id}')">
            <span>${data}</span>
        </div>
    `;

    return div;
}

// ================================================================
// 6. SISTEMA DE VOTAÇÃO
// ================================================================
async function votar(postId, tipoVoto, event) {
    event?.stopPropagation();

    if (!currentUser) {
        mostrarToast('Faz login para votar! 🔐', 'error');
        return;
    }

    if (isVoting[postId]) return;
    const votoAtual = userVotes[postId] || 0;

    // Tentar encontrar o elemento de score (no card ou no modal)
    const scoreEl = document.querySelector(`.score-val-${postId}`);
    if (!scoreEl) return;

    // UI Otimista
    const scoreDiff = (tipoVoto === votoAtual) ? -votoAtual : (tipoVoto - votoAtual);
    const currentScore = parseInt(scoreEl.textContent.replace(/[^\d-]/g, '') || '0');
    const novoScoreTemp = currentScore + scoreDiff;

    // Bloquear clique até terminar
    isVoting[postId] = true;
    actualizarVotoUI(postId, novoScoreTemp, tipoVoto === votoAtual ? 0 : tipoVoto);

    try {
        if (votoAtual === tipoVoto) {
            // Remover voto (toggle off)
            const { error } = await supabase.from('votos_posts').delete()
                .eq('post_id', postId)
                .eq('user_id', currentUser.id);
            if (error) throw error;
            userVotes[postId] = 0;
        } else {
            // Upsert (inserir ou alterar voto)
            const { error } = await supabase.from('votos_posts').upsert(
                { post_id: postId, user_id: currentUser.id, tipo_voto: tipoVoto },
                { onConflict: 'post_id,user_id' }
            );
            if (error) throw error;
            userVotes[postId] = tipoVoto;
        }
    } catch (err) {
        console.error('Erro ao votar:', err);
        mostrarToast('Erro ao registar voto.', 'error');
        // Reverter UI (O Realtime acabará por pôr o valor certo, mas isto ajuda)
    } finally {
        isVoting[postId] = false;
    }
}

function actualizarVotoUI(postId, novoScore, meuVoto) {
    // Actualizar todos os elementos que mostram o score deste post (Card e Modal)
    const displays = document.querySelectorAll(`.score-val-${postId}`);
    displays.forEach(el => {
        const isCard = el.id && el.id.startsWith('score-') && !el.id.includes('detalhe');
        el.textContent = isCard ? `▲ ${novoScore}` : novoScore;
        el.className = `vote-score ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''} score-val-${postId}`;
    });

    // Actualizar todos os grupos de botões ligados a este post (apenas no container do POST, não nos comentários)
    const postContainers = document.querySelectorAll(`[data-post-id="${postId}"], .post-footer, #modalDetalhePost .vote-group`);
    postContainers.forEach(container => {
        // Garantir que não estamos a mexer nos votos de comentários
        if (container.classList.contains('small') || container.closest('.comment-item')) return;

        container.querySelectorAll('.vote-btn.upvote').forEach(b => b.classList.toggle('active', meuVoto === 1));
        container.querySelectorAll('.vote-btn.downvote').forEach(b => b.classList.toggle('active', meuVoto === -1));
    });
}

function toggleActionsMenu(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`actions-${id}`);
    const alreadyOpen = menu.classList.contains('show');

    // Fechar todos
    document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('show'));

    if (!alreadyOpen && menu) {
        menu.classList.add('show');
    }

    // Fechar ao clicar fora
    const closeMenu = () => {
        if (menu) menu.classList.remove('show');
        document.removeEventListener('click', closeMenu);
    };
    document.addEventListener('click', closeMenu);
}

async function deletePost(postId, event) {
    event.stopPropagation();

    // Verificação de permissão frontal extra
    try {
        const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
        if (!isAdmin && post?.user_id !== currentUser?.id) {
            mostrarToast('Não tens permissão para apagar este post.', 'error');
            return;
        }
    } catch (e) { }

    const confirm = await showConfirmDialog('Tens a certeza que queres apagar este post permanentemente?', {
        confirmText: 'Apagar',
        cancelText: 'Cancelar'
    });
    if (!confirm) return;

    try {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) throw error;
        mostrarToast('Post apagado com sucesso.', 'success');
        carregarFeed(true);
    } catch (err) {
        console.error('Erro ao apagar post:', err);
        mostrarToast('Erro ao apagar post.', 'error');
    }
}

async function editPost(postId, event) {
    event?.stopPropagation();
    window.location.href = `criar-topico.html?edit=${postId}`;
}



// ================================================================
// 8.2 CONFIGURAR REALTIME (TEMPO-REAL)
// ================================================================
function initRealtime() {
    // Canal para Posts
    supabase
        .channel('public:posts')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, payload => {
            const up = payload.new;
            actualizarVotoUI(up.id, up.score, userVotes[up.id] || 0);
        })
        .subscribe();

    // Canal para Comentários
    supabase
        .channel('public:comentarios_posts')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comentarios_posts' }, payload => {
            const up = payload.new;
            actualizarVotoComentarioUI(up.id, up.score, userCommentVotes[up.id] || 0);
        })
        .subscribe();
}

// ================================================================
// 8.3 ESTATÍSTICAS DO FÓRUM E CONTADORES DE CATEGORIA
// ================================================================
async function carregarEstatisticas() {
    try {
        // Total de posts
        const { count: totalPosts } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });

        // Total de comentários
        const { count: totalComents } = await supabase
            .from('comentarios_posts')
            .select('*', { count: 'exact', head: true });

        // Posts de hoje
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const { count: hoje_count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .gte('criado_em', hoje.toISOString());

        // Atualizar stats bar
        const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n ?? 0);
        const el = id => document.getElementById(id);
        if (el('statTotalPosts'))  el('statTotalPosts').textContent  = fmt(totalPosts);
        if (el('statTotalComents')) el('statTotalComents').textContent = fmt(totalComents);
        if (el('statActiveToday')) el('statActiveToday').textContent = fmt(hoje_count);

        // Contadores por categoria
        const tipos = ['homebrew', 'personagem', 'mundo', 'narrativa', 'outro'];
        let all = 0;
        for (const tipo of tipos) {
            const { count } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('tipo', tipo);
            const countEl = document.getElementById(`count-${tipo}`);
            if (countEl) countEl.textContent = fmt(count);
            all += (count || 0);
        }
        const allEl = document.getElementById('count-all');
        if (allEl) allEl.textContent = fmt(all);

    } catch (err) {
        console.warn('Erro ao carregar estatísticas:', err);
    }
}



// ================================================================
// 10. ORDENAÇÃO + FILTRO POR CATEGORIA
// ================================================================

/** Navega para a página dedicada de tópico */
function navegarParaTopico(postId) {
    window.location.href = `topico.html?id=${postId}`;
}

function filtrarPorCategoria(btn, categoria) {
    // Atualizar botão ativo na sidebar
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Atualizar título do painel principal
    const label = btn.querySelector('.cat-label')?.textContent || 'Todos os Tópicos';
    const icon  = btn.querySelector('.cat-icon')?.textContent  || '🌐';
    const titleEl = document.getElementById('forumCategoryTitle');
    if (titleEl) titleEl.textContent = `${icon} ${label}`;

    // Guardar categoria na variável de estado global
    feedCategoriaFiltro = categoria;

    carregarFeed(true);
}

function mudarOrdem(ordem) {
    if (ordem !== 'score_desc' && ordem !== 'score_asc' && ordem !== 'recentes') return;
    feedOrdem = ordem;
    // Suporta tanto .feed-sort-btns como .forum-sort-group
    document.querySelectorAll('.forum-sort-group .sort-btn, .feed-sort-btns .sort-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.ordem === ordem);
    });
    carregarFeed(true);
}

// ================================================================
// 11. UTILITÁRIOS
// ================================================================
function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatarData(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const agora = new Date();
    const diff = agora - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    const horas = Math.floor(mins / 60);
    if (horas < 24) return `há ${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `há ${dias}d`;
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

let _toastTimer = null;
function mostrarToast(msg, tipo = '') {
    const toast = document.getElementById('toastComunidade');
    toast.textContent = msg;
    toast.className = `toast-comunidade ${tipo} show`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

window.feedComunidadeRecarregar = () => carregarFeed(true);
window.filtrarPorCategoria = filtrarPorCategoria;
window.navegarParaTopico = navegarParaTopico;

// Expor funções para onclick global
window.votar = votar;
window.mudarOrdem = mudarOrdem;
window.toggleActionsMenu = toggleActionsMenu;
window.editPost = editPost;
window.deletePost = deletePost;
window.loginWithGoogle = () => window.auth?.loginWithGoogle();
