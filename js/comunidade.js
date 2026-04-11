// ================================================================
// COMUNIDADE.JS — Sistema de Comunidade · Projeto Gênesis
// ================================================================

// ─── Estado Global ────────────────────────────────────────────
const POSTS_PER_PAGE = 20;
let feedOrdem = 'score_desc'; // score_desc | score_asc
let feedSearchDebounce = null;
let feedOffset = 0;
let feedEsgotado = false;
let feedCarregando = false;
let postAtualId = null;    // id do post aberto no detalhe
let currentUser = null;    // utilizador supabase
let userVotes = {};      // { post_id: tipo_voto }
let userCommentVotes = {};     // { comment_id: tipo_voto }
let isVoting = {};      // { id: true/false } para evitar spam
let isAdmin = false;    // se o user logado é admin
let isEditingPost = false; // flag para modo edição
let postEmEdicaoId = null;
// Dados para o modal de criação
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
        await carregarFichasECampanhasDoUser();

        // Verificar se é admin
        const { data: profile } = await supabase
            .from('perfis')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();
        isAdmin = profile?.is_admin || false;
    }

    // Eventos do formulário de criação
    document.querySelectorAll('input[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', onTipoChange);
    });

    document.getElementById('selectPersonagem')?.addEventListener('change', onPersonagemSelected);

    // Carregar votos do utilizador (para saber quais já votou)
    if (currentUser) {
        await carregarVotosDoUser();
    }

    // Carregar destaques e feed inicial
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
    document.getElementById('modalCriarPost')?.addEventListener('click', e => { if (e.target.id === 'modalCriarPost') fecharModalCriar(); });
    document.getElementById('modalDetalhePost')?.addEventListener('click', e => { if (e.target.id === 'modalDetalhePost') fecharModalDetalhe(); });

    // Tecla Escape fecha modais
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { fecharModalCriar(); fecharModalDetalhe(); }
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
        <div class="destaque-item" onclick="abrirDetalhe('${post.id}')">
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

    if (semana.length === 0 && mes.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';

    const rootSemana = document.getElementById('destaqueSemanaList');
    const rootMes = document.getElementById('destaqueMesList');

    if (semana.length === 0) {
        rootSemana.innerHTML = '<div class="destaque-empty">Nenhum post em destaque esta semana.</div>';
    } else {
        rootSemana.innerHTML = semana.map((p, i) => renderRowDestaque(p, i)).join('');
    }

    if (mes.length === 0) {
        rootMes.innerHTML = '<div class="destaque-empty">Nenhum post em destaque este mês.</div>';
    } else {
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
        document.querySelectorAll('#postsFeed .post-card').forEach(el => el.remove());
        document.getElementById('feedLoading').style.display = '';
        document.getElementById('feedEmpty').style.display = 'none';
        document.getElementById('scrollSentinel').style.display = 'none';
    }

    feedCarregando = true;

    try {
        const tipoFiltro = document.getElementById('feedTipoFiltro')?.value || '';
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

// ================================================================
// 5. RENDERIZAR CARD DE POST
// ================================================================
function criarCardPost(post) {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.dataset.postId = post.id;

    const tipo = TIPOS[post.tipo] || TIPOS.outro;
    const nomeUser = escapeHtml(post.perfis?.username || 'Utilizador');
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
    const avatar = post.perfis?.avatar_url || defaultAvatar;
    const data = formatarData(post.criado_em);

    // Referência (ficha ou campanha)
    let refHtml = '';
    if (post.personagens) {
        refHtml = `<div class="post-referencia" onclick="window.open('visualizar-ficha.html?id=${post.personagem_id}&view=true', '_blank'); event.stopPropagation();" style="cursor:pointer; display:inline-block; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')} <span style="font-size:0.85em; opacity:0.8;">(🔎 Clica para ver)</span></div>`;
    } else if (post.campanhas) {
        refHtml = `<div class="post-referencia" onclick="window.open('visualizar-campanha-jogador.html?id=${post.campanha_id}&view=true', '_blank'); event.stopPropagation();" style="cursor:pointer; display:inline-block; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">🎭 Campanha: ${escapeHtml(post.campanhas.nome)} <span style="font-size:0.85em; opacity:0.8;">(🔎 Clica para ver)</span></div>`;
    }

    const scoreClass = post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : '';
    const totalComentarios = post.comentarios_posts?.[0]?.count || 0;

    const isOwner = currentUser && post.user_id === currentUser.id;
    const canDelete = isOwner || isAdmin;
    const canEdit = isOwner;

    let actionsHtml = '';
    if (canDelete || canEdit) {
        actionsHtml = `
        <div class="post-actions-wrapper">
            <button class="btn-actions-toggle" onclick="toggleActionsMenu(event, 'post-${post.id}')">⋮</button>
            <div id="actions-post-${post.id}" class="actions-menu">
                ${canEdit ? `<button class="action-item" onclick="editPost('${post.id}', event)">
                    <span>✏️</span> Editar
                </button>` : ''}
                ${canDelete ? `<button class="action-item delete" onclick="deletePost('${post.id}', event)">
                    <span>🗑️</span> Apagar
                </button>` : ''}
            </div>
        </div>
        `;
    }

    div.innerHTML = `
        ${actionsHtml}
        <div class="post-header-total" onclick="abrirDetalhe('${post.id}')">
            <div class="post-header">
                <img class="post-avatar" src="${avatar}" alt="${nomeUser}" onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer">
                <div class="post-meta">
                    <div class="post-autor-nome">${nomeUser}</div>
                    <div class="post-data">${data}</div>
                </div>
                <span class="post-tipo-tag tipo-${post.tipo}">${tipo.emoji} ${tipo.label}</span>
            </div>

            <div class="post-titulo">${escapeHtml(post.titulo)}</div>
            <div class="post-conteudo">${escapeHtml(post.conteudo)}</div>
            ${refHtml}
        </div>

        <div class="post-footer">
            <div class="vote-group-simple">
                <span class="vote-score ${scoreClass} score-val-${post.id}" id="score-${post.id}">▲ ${post.score}</span>
            </div>
            <div class="post-stats-simple">
                <span class="comment-count-badge">💬 ${totalComentarios}</span>
            </div>
        </div>
    `;

    // Barra colorida lateral
    div.style.setProperty('--tipo-color', tipo.cor);
    div.style.cursor = 'pointer';

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
        fecharModalDetalhe();
    } catch (err) {
        console.error('Erro ao apagar post:', err);
        mostrarToast('Erro ao apagar post.', 'error');
    }
}

async function editPost(postId, event) {
    event?.stopPropagation();
    try {
        const { data: post, error } = await supabase.from('posts').select('*').eq('id', postId).single();
        if (error) throw error;

        if (post?.user_id !== currentUser?.id) {
            mostrarToast('Não tens permissão para editar este post.', 'error');
            return;
        }

        isEditingPost = true;
        postEmEdicaoId = postId;


        document.getElementById('modalCriarPost').querySelector('h2').textContent = '✏️ Editar Post';
        document.getElementById('btnSubmitPost').textContent = 'Guardar Alterações';

        // Preencher form
        const radio = document.getElementById(`tipo-${post.tipo}`);
        if (radio) {
            radio.checked = true;
            onTipoChange({ target: radio });
        }
        document.getElementById('postTitulo').value = post.titulo;
        document.getElementById('postConteudo').value = post.conteudo;

        if (post.personagem_id) document.getElementById('selectPersonagem').value = post.personagem_id;
        if (post.campanha_id) document.getElementById('selectCampanha').value = post.campanha_id;

        abrirModalCriar();
    } catch (err) {
        console.error('Erro ao editar post:', err);
        mostrarToast('Erro ao carregar dados para edição.', 'error');
    }
}

// ================================================================
// 7. MODAL DE DETALHE
// ================================================================
async function abrirDetalhe(postId) {
    postAtualId = postId;

    // Abrir modal
    const modal = document.getElementById('modalDetalhePost');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const detalheDiv = document.getElementById('detalheConteudo');
    detalheDiv.innerHTML = '<div class="feed-loading"><div class="spinner"></div></div>';
    document.getElementById('comentariosList').innerHTML = '';
    document.getElementById('comentariosCount').textContent = '0';

    try {
        // Carregar post
        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                id, tipo, titulo, conteudo, score, criado_em, user_id,
                personagem_id, campanha_id,
                perfis:user_id ( username, avatar_url ),
                personagens ( nome, raca, nivel ),
                campanhas ( nome )
            `)
            .eq('id', postId)
            .single();

        if (error) throw error;

        const tipo = TIPOS[post.tipo] || TIPOS.outro;
        const meuVoto = userVotes[post.id] || 0;
        const nomeUser = escapeHtml(post.perfis?.username || 'Utilizador');
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
        const avatar = post.perfis?.avatar_url || defaultAvatar;

        let refHtml = '';
        if (post.personagens) {
            refHtml = `<div class="post-referencia" onclick="window.open('visualizar-ficha.html?id=${post.personagem_id}&view=true', '_blank')" style="cursor:pointer; display:inline-block; margin-bottom: 15px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')} <span style="font-size:0.85em; opacity:0.8;">(🔎 Visualizar Ficha)</span></div>`;
        } else if (post.campanhas) {
            refHtml = `<div class="post-referencia" onclick="window.open('visualizar-campanha-jogador.html?id=${post.campanha_id}&view=true', '_blank')" style="cursor:pointer; display:inline-block; margin-bottom: 15px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">🎭 Campanha: ${escapeHtml(post.campanhas.nome)} <span style="font-size:0.85em; opacity:0.8;">(🔎 Visualizar Campanha)</span></div>`;
        }

        detalheDiv.innerHTML = `
            <div class="post-header">
                <img class="post-avatar" src="${avatar}" alt="${nomeUser}" onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer">
                <div class="post-meta">
                    <div class="post-autor-nome">${nomeUser}</div>
                    <div class="post-data">${formatarData(post.criado_em)}</div>
                </div>
                <span class="post-tipo-tag tipo-${post.tipo}">${tipo.emoji} ${tipo.label}</span>
            </div>
            <div class="post-titulo" style="font-size:1.25rem; margin:14px 0 10px;">${escapeHtml(post.titulo)}</div>
            ${refHtml}
            <div class="detail-conteudo">${escapeHtml(post.conteudo)}</div>
            <div class="post-footer" style="border-top:1px solid rgba(255,255,255,0.07); padding-top:14px; margin-top:10px;">
                <div class="vote-group">
                    <button class="vote-btn upvote ${meuVoto === 1 ? 'active' : ''}"
                        onclick="votar('${post.id}', 1, event)" title="Gosto">▲</button>
                    <button class="vote-btn downvote ${meuVoto === -1 ? 'active' : ''}"
                        onclick="votar('${post.id}', -1, event)" title="Não gosto">▼</button>
                    <span class="vote-score ${post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : ''} score-val-${post.id}"
                          id="score-detalhe-${post.id}">${post.score}</span>
                </div>
            </div>
        `;

        // Carregar comentários
        await carregarComentarios(postId);

        // Mostrar área de comentário
        const inputArea = document.getElementById('comentarioInputArea');
        const loginAviso = document.getElementById('comentarioLoginAviso');
        if (currentUser) {
            inputArea.style.display = '';
            loginAviso.style.display = 'none';
        } else {
            inputArea.style.display = 'none';
            loginAviso.style.display = '';
        }

    } catch (err) {
        console.error('Erro ao abrir detalhe:', err);
        detalheDiv.innerHTML = '<p style="color:rgba(255,255,255,0.4);">Erro ao carregar post.</p>';
    }
}

function fecharModalDetalhe() {
    const modal = document.getElementById('modalDetalhePost');
    modal.classList.remove('open');
    document.body.style.overflow = '';
    postAtualId = null;
    document.getElementById('novoComentario').value = '';
}

// ================================================================
// 8. COMENTÁRIOS
// ================================================================
async function carregarComentarios(postId) {
    try {
        const { data, error } = await supabase
            .from('comentarios_posts')
            .select(`
                id, texto, criado_em, user_id, score, parent_id,
                perfis:user_id ( username, avatar_url )
            `)
            .eq('post_id', postId)
            .order('criado_em', { ascending: true });

        if (error) throw error;

        const lista = document.getElementById('comentariosList');
        const count = document.getElementById('comentariosCount');

        count.textContent = (data || []).length;

        lista.innerHTML = '';
        renderizarThreadComentarios(data, lista);

    } catch (err) {
        console.error('Erro ao carregar comentários:', err);
    }
}

/**
 * Renderiza comentários recursivamente (Reddit-style)
 */
function renderizarThreadComentarios(allComments, container, parentId = null) {
    const thread = allComments.filter(c => c.parent_id === parentId);
    if (thread.length === 0) return;

    thread.forEach(c => {
        const nomeUser = escapeHtml(c.perfis?.username || 'Utilizador');
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
        const avatar = c.perfis?.avatar_url || defaultAvatar;
        const meuVoto = userCommentVotes[c.id] || 0;
        const score = c.score || 0;
        const scoreClass = score > 0 ? 'positive' : score < 0 ? 'negative' : '';
        const isOwner = currentUser && c.user_id === currentUser.id;
        const canDelete = isOwner || isAdmin;
        const canEdit = isOwner;

        let actionsHtml = '';
        if (canDelete || canEdit) {
            actionsHtml = `
            <div class="comment-actions-wrapper">
                <button class="btn-actions-toggle" onclick="toggleActionsMenu(event, 'comm-${c.id}')">⋮</button>
                <div id="actions-comm-${c.id}" class="actions-menu">
                    ${canEdit ? `<button class="action-item" onclick="editComment('${c.id}', event)">
                        <span>✏️</span> Editar
                    </button>` : ''}
                    ${canDelete ? `<button class="action-item delete" onclick="deleteComment('${c.id}', event)">
                        <span>🗑️</span> Apagar
                    </button>` : ''}
                </div>
            </div>
            `;
        }

        const div = document.createElement('div');
        div.className = 'comment-item';
        div.id = `comment-${c.id}`;
        div.innerHTML = `
            <div class="comment-main-content">
                <img class="comment-avatar" src="${avatar}" alt="${nomeUser}" onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer">
                <div class="comment-body">
                    <div class="comment-text-wrapper">
                        <span class="comment-username">${nomeUser}</span>
                        <span class="comment-texto" id="comment-text-${c.id}">${escapeHtml(c.texto)}</span>
                    </div>
                    <div class="comment-footer-actions">
                        <span class="comment-data">${formatarData(c.criado_em)}</span>
                        
                        <div class="comment-votes-ig">
                            <span class="vote-link up ${meuVoto === 1 ? 'active' : ''}" 
                                  onclick="votarComentario('${c.id}', 1, event)">▲</span>
                            <span class="comment-score-val ${scoreClass} score-comm-val-${c.id}">${score}</span>
                            <span class="vote-link down ${meuVoto === -1 ? 'active' : ''}" 
                                  onclick="votarComentario('${c.id}', -1, event)">▼</span>
                        </div>

                        ${currentUser ? `<button class="btn-reply" onclick="abrirReply('${c.id}')">Responder</button>` : ''}
                    </div>
                </div>
                ${actionsHtml}
            </div>
            <div id="reply-area-${c.id}"></div>
            <div class="comment-replies" id="replies-${c.id}"></div>
        `;

        container.appendChild(div);

        // Renderizar filhos (recursão)
        const repliesContainer = div.querySelector(`#replies-${c.id}`);
        renderizarThreadComentarios(allComments, repliesContainer, c.id);
    });
}


async function enviarComentario() {
    if (!currentUser) { mostrarToast('Faz login para comentar.', 'error'); return; }

    const textarea = document.getElementById('novoComentario');
    const texto = textarea.value.trim();
    if (!texto) return;

    const btn = document.querySelector('.btn-comment-send');
    btn.disabled = true;

    try {
        const { error } = await supabase.from('comentarios_posts').insert({
            post_id: postAtualId,
            user_id: currentUser.id,
            texto
        });

        if (error) throw error;

        textarea.value = '';
        textarea.style.height = 'auto';
        await carregarComentarios(postAtualId);
        mostrarToast('Comentário publicado! 💬', 'success');

    } catch (err) {
        console.error('Erro ao enviar comentário:', err);
        mostrarToast('Erro ao publicar comentário.', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function deleteComment(commentId, event) {
    event.stopPropagation();

    // Proteção extra
    try {
        const { data: comm } = await supabase.from('comentarios_posts').select('user_id').eq('id', commentId).single();
        if (!isAdmin && comm?.user_id !== currentUser?.id) {
            mostrarToast('Não tens permissão para apagar este comentário.', 'error');
            return;
        }
    } catch (e) { }

    const confirm = await showConfirmDialog('Queres apagar este comentário?', {
        confirmText: 'Apagar',
        cancelText: 'Cancelar'
    });
    if (!confirm) return;

    try {
        const { error } = await supabase.from('comentarios_posts').delete().eq('id', commentId);
        if (error) throw error;
        mostrarToast('Comentário removido.', 'success');
        await carregarComentarios(postAtualId);
    } catch (err) {
        console.error('Erro ao apagar comentário:', err);
        mostrarToast('Erro ao apagar comentário.', 'error');
    }
}

async function editComment(commentId, event) {
    event.stopPropagation();

    const { data: comm } = await supabase.from('comentarios_posts').select('user_id').eq('id', commentId).single();
    if (comm?.user_id !== currentUser?.id) {
        mostrarToast('Não tens permissão para editar este comentário.', 'error');
        return;
    }

    const textEl = document.getElementById(`comment-text-${commentId}`);
    const originalText = textEl.textContent;


    const novoTexto = prompt('Edita o teu comentário:', originalText);
    if (novoTexto === null || novoTexto.trim() === '' || novoTexto === originalText) return;

    try {
        const { error } = await supabase.from('comentarios_posts').update({ texto: novoTexto.trim() }).eq('id', commentId);
        if (error) throw error;
        mostrarToast('Comentário atualizado.', 'success');
        await carregarComentarios(postAtualId);
    } catch (err) {
        console.error('Erro ao editar comentário:', err);
        mostrarToast('Erro ao atualizar comentário.', 'error');
    }
}

function abrirReply(commentId) {
    const area = document.getElementById(`reply-area-${commentId}`);
    if (area.innerHTML !== '') {
        area.innerHTML = '';
        return;
    }

    // Fechar outras áreas de reply abertas
    document.querySelectorAll('[id^="reply-area-"]').forEach(el => el.innerHTML = '');

    area.innerHTML = `
        <div class="reply-input-wrapper">
            <textarea class="reply-textarea" id="input-reply-${commentId}" placeholder="Escreve a tua resposta..." rows="2"></textarea>
            <div class="reply-actions">
                <button class="btn-small btn-reply-cancel" onclick="cancelarReply('${commentId}')">Cancelar</button>
                <button class="btn-small btn-reply-send" onclick="enviarResposta('${commentId}')">Responder</button>
            </div>
        </div>
    `;
    area.querySelector('textarea').focus();
}

function cancelarReply(commentId) {
    document.getElementById(`reply-area-${commentId}`).innerHTML = '';
}

async function enviarResposta(parentId) {
    const textarea = document.getElementById(`input-reply-${parentId}`);
    const texto = textarea.value.trim();
    if (!texto) return;

    try {
        const { error } = await supabase.from('comentarios_posts').insert({
            post_id: postAtualId,
            user_id: currentUser.id,
            parent_id: parentId,
            texto
        });

        if (error) throw error;
        mostrarToast('Resposta enviada! ⤴️', 'success');
        await carregarComentarios(postAtualId);
    } catch (err) {
        console.error('Erro ao enviar resposta:', err);
        mostrarToast('Erro ao enviar resposta.', 'error');
    }
}

// ================================================================
// 8.1 VOTAR EM COMENTÁRIO
// ================================================================
async function votarComentario(commentId, tipoVoto, event) {
    event?.stopPropagation();

    if (isVoting[commentId]) return;
    const votoAtual = userCommentVotes[commentId] || 0;
    const scoreEl = document.querySelector(`.score-comm-val-${commentId}`);
    if (!scoreEl) return;

    // UI Otimista
    const scoreDiff = (tipoVoto === votoAtual) ? -votoAtual : (tipoVoto - votoAtual);
    const currentScore = parseInt(scoreEl.textContent.replace(/[^\d-]/g, '') || '0');
    const novoScoreTemp = currentScore + scoreDiff;

    isVoting[commentId] = true;
    actualizarVotoComentarioUI(commentId, novoScoreTemp, tipoVoto === votoAtual ? 0 : tipoVoto);

    try {
        if (votoAtual === tipoVoto) {
            const { error } = await supabase.from('votos_comentarios').delete()
                .eq('comentario_id', commentId)
                .eq('user_id', currentUser.id);
            if (error) throw error;
            userCommentVotes[commentId] = 0;
        } else {
            const { error } = await supabase.from('votos_comentarios').upsert(
                { comentario_id: commentId, user_id: currentUser.id, tipo_voto: tipoVoto },
                { onConflict: 'comentario_id,user_id' }
            );
            if (error) throw error;
            userCommentVotes[commentId] = tipoVoto;
        }
    } catch (err) {
        console.error('Erro ao votar no comentário:', err);
        mostrarToast('Erro ao registar voto.', 'error');
    } finally {
        isVoting[commentId] = false;
    }
}

function actualizarVotoComentarioUI(commentId, novoScore, meuVoto) {
    const displays = document.querySelectorAll(`.score-comm-val-${commentId}`);
    displays.forEach(el => {
        el.textContent = novoScore;
        el.className = `comment-score-val ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''} score-comm-val-${commentId}`;

        // Encontrar o container IG específico
        const group = el.closest('.comment-votes-ig');
        if (group) {
            group.querySelector('.vote-link.up')?.classList.toggle('active', meuVoto === 1);
            group.querySelector('.vote-link.down')?.classList.toggle('active', meuVoto === -1);
        }
    });
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
// 9. CRIAR POST
// ================================================================
function abrirModalCriar() {
    if (!currentUser) {
        mostrarToast('Faz login para publicar! 🔐', 'error');
        return;
    }
    const modal = document.getElementById('modalCriarPost');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function fecharModalCriar() {
    const modal = document.getElementById('modalCriarPost');
    modal.classList.remove('open');
    document.body.style.overflow = '';

    // Reset state
    isEditingPost = false;
    postEmEdicaoId = null;
    document.getElementById('modalCriarPost').querySelector('h2').textContent = '✨ Publicar Post';
    document.getElementById('btnSubmitPost').textContent = 'Publicar';
    document.getElementById('formCriarPost').reset();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnPublicar')?.addEventListener('click', abrirModalCriar);
});

async function submitPost(event) {
    event.preventDefault();

    const btn = document.getElementById('btnSubmitPost');
    btn.disabled = true;
    btn.textContent = 'A publicar…';

    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || 'outro';
    const titulo = document.getElementById('postTitulo').value.trim();
    const conteudo = document.getElementById('postConteudo').value.trim();
    const fichaId = document.getElementById('selectPersonagem').value || null;
    const campanhaId = document.getElementById('selectCampanha').value || null;

    if (!titulo || !conteudo) {
        mostrarToast('Preenche o título e o conteúdo.', 'error');
        btn.disabled = false;
        btn.textContent = 'Publicar';
        return;
    }

    try {
        let result;
        const postData = {
            user_id: currentUser.id,
            tipo,
            titulo,
            conteudo,
            personagem_id: tipo === 'personagem' ? fichaId : null,
            campanha_id: (tipo === 'mundo' || tipo === 'narrativa') ? campanhaId : null
        };

        if (isEditingPost && postEmEdicaoId) {
            result = await supabase.from('posts').update(postData).eq('id', postEmEdicaoId);
        } else {
            result = await supabase.from('posts').insert(postData);
        }

        if (result.error) throw result.error;

        fecharModalCriar();
        mostrarToast(isEditingPost ? 'Post atualizado! ✅' : 'Post publicado com sucesso! 🎉', 'success');
        carregarFeed(true);
        if (isEditingPost && postAtualId === postEmEdicaoId) {
            abrirDetalhe(postAtualId); // Refresh modal se estiver aberto
        }

    } catch (err) {
        console.error('Erro ao publicar:', err);
        mostrarToast('Erro ao publicar o post.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publicar';
    }
}

// ─── Integração com fichas ──────────────────────────────────────
async function carregarFichasECampanhasDoUser() {
    try {
        // Fichas (personagens usa perfil_id, não user_id)
        const { data: fichas } = await supabase
            .from('personagens')
            .select('id, nome, raca, nivel')
            .eq('perfil_id', currentUser.id)
            .order('nome');

        fichasDoUser = fichas || [];
        const sel = document.getElementById('selectPersonagem');
        fichas?.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.nome} (${f.raca || '?'} · Nível ${f.nivel || '?'})`;
            sel.appendChild(opt);
        });

        // Campanhas criadas pelo utilizador (narrador_id ou user_id)
        // Tentar narrador_id primeiro, depois fallback para user_id
        let { data: campanhas } = await supabase
            .from('campanhas')
            .select('id, nome')
            .eq('narrador_id', currentUser.id)
            .order('nome');

        if (!campanhas || campanhas.length === 0) {
            const res = await supabase
                .from('campanhas')
                .select('id, nome')
                .eq('user_id', currentUser.id)
                .order('nome');
            campanhas = res.data;
        }

        campanhasDoUser = campanhas || [];
        const selC = document.getElementById('selectCampanha');
        campanhas?.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            selC.appendChild(opt);
        });

    } catch (err) {
        console.warn('Erro ao carregar fichas/campanhas:', err);
    }
}

function onTipoChange() {
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    const refF = document.getElementById('refPersonagemSection');
    const refC = document.getElementById('refCampanhaSection');

    refF.classList.toggle('visible', tipo === 'personagem');
    refC.classList.toggle('visible', tipo === 'mundo' || tipo === 'narrativa');
}

function onPersonagemSelected() {
    const fichaId = this.value;
    const preview = document.getElementById('fichaPreview');
    if (!fichaId) { preview.style.display = 'none'; return; }

    const ficha = fichasDoUser.find(f => f.id === fichaId);
    if (!ficha) return;

    preview.style.display = '';
    preview.innerHTML = `
        <strong>🧙 ${escapeHtml(ficha.nome)}</strong><br>
        Raça: ${escapeHtml(ficha.raca || '?')} &nbsp;|&nbsp; Nível: ${ficha.nivel || '?'}
    `;
}

// ================================================================
// 10. ORDENAÇÃO DO FEED
// ================================================================
function mudarOrdem(ordem) {
    if (ordem !== 'score_desc' && ordem !== 'score_asc' && ordem !== 'recentes') return;
    feedOrdem = ordem;
    document.querySelectorAll('.feed-sort-btns .sort-btn').forEach(b => {
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

// Expor funções para onclick global
window.votar = votar;
window.abrirDetalhe = abrirDetalhe;
window.fecharModalDetalhe = fecharModalDetalhe;
window.votarComentario = votarComentario;
window.enviarComentario = enviarComentario;
window.abrirModalCriar = abrirModalCriar;
window.fecharModalCriar = fecharModalCriar;
window.submitPost = submitPost;
window.mudarOrdem = mudarOrdem;
window.toggleActionsMenu = toggleActionsMenu;
window.editPost = editPost;
window.deletePost = deletePost;
window.editComment = editComment;
window.deleteComment = deleteComment;
window.abrirReply = abrirReply;
window.cancelarReply = cancelarReply;
window.enviarResposta = enviarResposta;
window.loginWithGoogle = () => window.auth?.loginWithGoogle(); // Fallback para auth.js
