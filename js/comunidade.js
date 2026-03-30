// ================================================================
// COMUNIDADE.JS — Sistema de Comunidade · Projeto Gênesis
// ================================================================

// ─── Estado Global ────────────────────────────────────────────
const POSTS_PER_PAGE = 20;
let   feedOrdem       = 'recentes';
let   feedOffset      = 0;
let   feedEsgotado    = false;
let   feedCarregando  = false;
let   postAtualId     = null;    // id do post aberto no detalhe
let   currentUser     = null;    // utilizador supabase
let   userVotes       = {};      // { post_id: tipo_voto }
let   destaquePeriodo = 'semana'; // (legacy, not really used in split view)

// Dados para o modal de criação
let fichasDoUser    = [];
let campanhasDoUser = [];

// ─── Tipos de post ─────────────────────────────────────────────
const TIPOS = {
    homebrew:   { label: 'Homebrew',   cor: '#f59e0b', emoji: '⚗️' },
    personagem: { label: 'Personagem', cor: '#8b5cf6', emoji: '🧙' },
    mundo:      { label: 'Mundo',      cor: '#10b981', emoji: '🌍' },
    narrativa:  { label: 'Narrativa',  cor: '#3b82f6', emoji: '📖' },
    outro:      { label: 'Outro',      cor: '#6b7280', emoji: '💬' }
};

// ================================================================
// 1. INICIALIZAÇÃO
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Determinar utilizador logado (pode ser null — página é pública)
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
    } catch {}

    // Mostrar botão "Publicar" e área de comentários só se logado
    if (currentUser) {
        const btn = document.getElementById('btnPublicar');
        if (btn) btn.style.display = 'inline-flex';
        await carregarFichasECampanhasDoUser();
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

    // Fechar modais ao clicar no overlay
    document.getElementById('modalCriarPost')  ?.addEventListener('click', e => { if (e.target.id === 'modalCriarPost')  fecharModalCriar(); });
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
        const { data, error } = await supabase
            .from('votos_posts')
            .select('post_id, tipo_voto')
            .eq('user_id', currentUser.id);
        if (!error && data) {
            userVotes = {};
            data.forEach(v => { userVotes[v.post_id] = v.tipo_voto; });
        }
    } catch (e) { console.warn('votos:', e); }
}

// ================================================================
// 3. DESTAQUES AUTOMÁTICOS (calculados no cliente)
// ================================================================
async function carregarDestaques() {
    try {
        const agora = new Date();
        const umaSemana = new Date(agora - 7 * 24 * 3600 * 1000);
        const umMes     = new Date(agora - 30 * 24 * 3600 * 1000);

        // Busca posts com score >= 1 criados nos últimos 30 dias
        const { data, error } = await supabase
            .from('posts')
            .select(`
                id, titulo, tipo, score, criado_em, user_id,
                perfis ( username, avatar_url )
            `)
            .gte('score', 1)
            .gte('criado_em', umMes.toISOString())
            .order('score', { ascending: false })
            .limit(20);

        if (error || !data || data.length === 0) return;

        // Classificar em semana / mês
        const listaSemana = data.filter(p => new Date(p.criado_em) >= umaSemana).slice(0, 5);
        const listaMes    = data.slice(0, 5);

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
    const rootMes    = document.getElementById('destaqueMesList');

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

    if (reset) {
        feedOffset   = 0;
        feedEsgotado = false;
        // Limpar cards existentes (preservar loading e empty)
        document.querySelectorAll('#postsFeed .post-card').forEach(el => el.remove());
        document.getElementById('feedLoading').style.display = '';
        document.getElementById('feedEmpty').style.display   = 'none';
        document.getElementById('scrollSentinel').style.display = 'none';
    }

    feedCarregando = true;

    try {
        let query = supabase
            .from('posts')
            .select(`
                id, tipo, titulo, conteudo, score, criado_em, user_id,
                personagem_id, campanha_id,
                perfis ( username, avatar_url ),
                personagens ( nome, raca, nivel ),
                campanhas ( nome )
            `);

        if (feedOrdem === 'recentes') {
            query = query
                .order('criado_em', { ascending: false })
                .range(feedOffset, feedOffset + POSTS_PER_PAGE - 1);
        } else if (feedOrdem === 'votados') {
            query = query
                .order('score', { ascending: false })
                .range(feedOffset, feedOffset + POSTS_PER_PAGE - 1);
        } else {
            // Tendência: busca recente e ordena por tendência no cliente
            query = query
                .gte('criado_em', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
                .order('criado_em', { ascending: false })
                .limit(50);
        }

        const { data, error } = await query;

        document.getElementById('feedLoading').style.display = 'none';

        if (error) throw error;

        let posts = data || [];

        // Ordenação de tendência no cliente
        if (feedOrdem === 'tendencia') {
            posts = posts
                .map(p => ({ ...p, _trend: calcularTendencia(p) }))
                .sort((a, b) => b._trend - a._trend)
                .slice(0, POSTS_PER_PAGE);
        }

        if (posts.length === 0 && feedOffset === 0) {
            document.getElementById('feedEmpty').style.display = '';
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

// ─── Fórmula de tendência ──────────────────────────────────────
function calcularTendencia(post) {
    const horasDesde = (Date.now() - new Date(post.criado_em)) / 3600000;
    return post.score / Math.pow(horasDesde + 2, 1.5);
}

// ================================================================
// 5. RENDERIZAR CARD DE POST
// ================================================================
function criarCardPost(post) {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.dataset.postId = post.id;

    const tipo   = TIPOS[post.tipo] || TIPOS.outro;
    const meuVoto = userVotes[post.id] || 0;
    const avatar = post.perfis?.avatar_url || '../assets/default-avatar.png';
    const nomeUser = escapeHtml(post.perfis?.username || 'Utilizador');
    const data   = formatarData(post.criado_em);

    // Referência (ficha ou campanha)
    let refHtml = '';
    if (post.personagens) {
        refHtml = `<div class="post-referencia">🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')}</div>`;
    } else if (post.campanhas) {
        refHtml = `<div class="post-referencia">🎭 Campanha: ${escapeHtml(post.campanhas.nome)}</div>`;
    }

    const scoreClass = post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : '';

    div.innerHTML = `
        <div class="post-header">
            <img class="post-avatar" src="${avatar}" alt="${nomeUser}" onerror="this.src='../assets/default-avatar.png'">
            <div class="post-meta">
                <div class="post-autor-nome">${nomeUser}</div>
                <div class="post-data">${data}</div>
            </div>
            <span class="post-tipo-tag tipo-${post.tipo}">${tipo.emoji} ${tipo.label}</span>
        </div>

        <div class="post-titulo">${escapeHtml(post.titulo)}</div>
        <div class="post-conteudo">${escapeHtml(post.conteudo)}</div>
        ${refHtml}

        <div class="post-footer">
            <div class="vote-group">
                <button class="vote-btn upvote ${meuVoto === 1 ? 'active' : ''}"
                    onclick="votar('${post.id}', 1, event)" title="Gosto">▲</button>
                <span class="vote-score ${scoreClass}" id="score-${post.id}">${post.score}</span>
                <button class="vote-btn downvote ${meuVoto === -1 ? 'active' : ''}"
                    onclick="votar('${post.id}', -1, event)" title="Não gosto">▼</button>
            </div>
            <button class="comment-btn" onclick="abrirDetalhe('${post.id}')">
                💬 Comentários
            </button>
            <button class="expand-btn" onclick="abrirDetalhe('${post.id}')">
                Ver mais →
            </button>
        </div>
    `;

    // Barra colorida lateral
    div.style.setProperty('--tipo-color', tipo.cor);

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

    const votoAtual = userVotes[postId] || 0;
    const scoreEl   = document.getElementById(`score-${postId}`);

    // Animar botão clicado
    const btnClicado = event?.currentTarget;
    btnClicado?.classList.add('pop');
    setTimeout(() => btnClicado?.classList.remove('pop'), 300);

    try {
        if (votoAtual === tipoVoto) {
            // Remover voto (toggle off)
            await supabase.from('votos_posts').delete()
                .eq('post_id', postId)
                .eq('user_id', currentUser.id);
            userVotes[postId] = 0;
        } else {
            // Upsert (inserir ou alterar voto)
            await supabase.from('votos_posts').upsert(
                { post_id: postId, user_id: currentUser.id, tipo_voto: tipoVoto },
                { onConflict: 'post_id,user_id' }
            );
            userVotes[postId] = tipoVoto;
        }

        // Buscar score actualizado (depois da trigger)
        const { data } = await supabase
            .from('posts').select('score').eq('id', postId).single();
        const novoScore = data?.score ?? 0;

        // Actualizar UI do card no feed
        actualizarVotoUI(postId, novoScore, userVotes[postId]);

        // Actualizar UI no modal de detalhe (se aberto)
        if (postAtualId === postId) {
            const scoreDetalhe = document.getElementById(`score-detalhe-${postId}`);
            if (scoreDetalhe) scoreDetalhe.textContent = novoScore;
        }

    } catch (err) {
        console.error('Erro ao votar:', err);
        mostrarToast('Erro ao registar voto.', 'error');
    }
}

function actualizarVotoUI(postId, novoScore, meuVoto) {
    // Card no feed
    const scoreEl = document.getElementById(`score-${postId}`);
    if (scoreEl) {
        scoreEl.textContent = novoScore;
        scoreEl.className   = `vote-score ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''}`;
    }
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    if (card) {
        card.querySelector('.vote-btn.upvote')  ?.classList.toggle('active', meuVoto === 1);
        card.querySelector('.vote-btn.downvote')?.classList.toggle('active', meuVoto === -1);
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
                perfis ( username, avatar_url ),
                personagens ( nome, raca, nivel ),
                campanhas ( nome )
            `)
            .eq('id', postId)
            .single();

        if (error) throw error;

        const tipo = TIPOS[post.tipo] || TIPOS.outro;
        const meuVoto = userVotes[post.id] || 0;
        const avatar = post.perfis?.avatar_url || '../assets/default-avatar.png';

        let refHtml = '';
        if (post.personagens) {
            refHtml = `<div class="post-referencia">🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')}</div>`;
        } else if (post.campanhas) {
            refHtml = `<div class="post-referencia">🎭 Campanha: ${escapeHtml(post.campanhas.nome)}</div>`;
        }

        detalheDiv.innerHTML = `
            <div class="post-header">
                <img class="post-avatar" src="${avatar}" alt="" onerror="this.src='../assets/default-avatar.png'">
                <div class="post-meta">
                    <div class="post-autor-nome">${escapeHtml(post.perfis?.username || 'Utilizador')}</div>
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
                    <span class="vote-score ${post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : ''}"
                          id="score-detalhe-${post.id}">${post.score}</span>
                    <button class="vote-btn downvote ${meuVoto === -1 ? 'active' : ''}"
                        onclick="votar('${post.id}', -1, event)" title="Não gosto">▼</button>
                </div>
            </div>
        `;

        // Carregar comentários
        await carregarComentarios(postId);

        // Mostrar área de comentário
        const inputArea = document.getElementById('comentarioInputArea');
        const loginAviso = document.getElementById('comentarioLoginAviso');
        if (currentUser) {
            inputArea.style.display  = '';
            loginAviso.style.display = 'none';
        } else {
            inputArea.style.display  = 'none';
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
                id, texto, criado_em, user_id,
                perfis:user_id ( username, avatar_url )
            `)
            .eq('post_id', postId)
            .order('criado_em', { ascending: true });

        if (error) throw error;

        const lista = document.getElementById('comentariosList');
        const count = document.getElementById('comentariosCount');

        count.textContent = (data || []).length;

        if (!data || data.length === 0) {
            lista.innerHTML = '<p style="font-size:0.85rem; color:rgba(255,255,255,0.3); padding:8px 0;">Ainda não há comentários. Sê o primeiro!</p>';
            return;
        }

        lista.innerHTML = data.map(c => `
            <div class="comment-item">
                <img class="comment-avatar" src="${c.perfis?.avatar_url || '../assets/default-avatar.png'}" alt=""
                     onerror="this.src='../assets/default-avatar.png'">
                <div class="comment-body">
                    <div class="comment-autor">
                        ${escapeHtml(c.perfis?.username || 'Utilizador')}
                        <span class="comment-data">${formatarData(c.criado_em)}</span>
                    </div>
                    <div class="comment-texto">${escapeHtml(c.texto)}</div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Erro ao carregar comentários:', err);
    }
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
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnPublicar')?.addEventListener('click', abrirModalCriar);
});

async function submitPost(event) {
    event.preventDefault();

    const btn = document.getElementById('btnSubmitPost');
    btn.disabled = true;
    btn.textContent = 'A publicar…';

    const tipo      = document.querySelector('input[name="tipo"]:checked')?.value || 'outro';
    const titulo    = document.getElementById('postTitulo').value.trim();
    const conteudo  = document.getElementById('postConteudo').value.trim();
    const fichaId   = document.getElementById('selectPersonagem').value || null;
    const campanhaId = document.getElementById('selectCampanha').value || null;

    if (!titulo || !conteudo) {
        mostrarToast('Preenche o título e o conteúdo.', 'error');
        btn.disabled = false;
        btn.textContent = 'Publicar';
        return;
    }

    try {
        const { error } = await supabase.from('posts').insert({
            user_id:      currentUser.id,
            tipo,
            titulo,
            conteudo,
            personagem_id: tipo === 'personagem' ? fichaId : null,
            campanha_id:   (tipo === 'mundo' || tipo === 'narrativa') ? campanhaId : null
        });

        if (error) throw error;

        fecharModalCriar();
        document.getElementById('formCriarPost').reset();
        document.getElementById('fichaPreview').style.display = 'none';
        document.getElementById('refPersonagemSection').classList.remove('visible');
        document.getElementById('refCampanhaSection').classList.remove('visible');
        mostrarToast('Post publicado com sucesso! 🎉', 'success');
        mudarOrdem('recentes');

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
    feedOrdem = ordem;
    document.querySelectorAll('.sort-btn').forEach(b => {
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
    const diff  = agora - d;
    const mins  = Math.floor(diff / 60000);
    if (mins < 1)   return 'agora mesmo';
    if (mins < 60)  return `há ${mins} min`;
    const horas = Math.floor(mins / 60);
    if (horas < 24) return `há ${horas}h`;
    const dias  = Math.floor(horas / 24);
    if (dias < 7)   return `há ${dias}d`;
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

let _toastTimer = null;
function mostrarToast(msg, tipo = '') {
    const toast = document.getElementById('toastComunidade');
    toast.textContent = msg;
    toast.className   = `toast-comunidade ${tipo} show`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
