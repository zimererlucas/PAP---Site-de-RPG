// ================================================================
// TOPICO.JS — Página de Tópico de Fórum · Projeto Gênesis
// ================================================================

const TIPOS = {
    homebrew:  { label: 'Homebrew',  cor: '#f59e0b', emoji: '⚗️' },
    personagem:{ label: 'Personagem',cor: '#8b5cf6', emoji: '🧙' },
    mundo:     { label: 'Mundo',     cor: '#10b981', emoji: '🌍' },
    narrativa: { label: 'Narrativa', cor: '#3b82f6', emoji: '📖' },
    outro:     { label: 'Outro',     cor: '#6b7280', emoji: '💬' }
};

let postId       = null;
let currentUser  = null;
let isAdmin      = false;
let meuVotoPost  = 0;
let userCommentVotes = {};
let isVoting     = {};
let ordemComentarios = 'recentes';

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Obter ID do post pela URL
    const params = new URLSearchParams(window.location.search);
    postId = params.get('id');

    if (!postId) {
        mostrarErro();
        return;
    }

    // Utilizador logado
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
    } catch {}

    if (currentUser) {
        const { data: profile } = await supabase
            .from('perfis')
            .select('is_admin')
            .eq('id', currentUser.id)
            .maybeSingle();
        isAdmin = profile?.is_admin || false;

        // Carregar voto do user neste post
        const { data: voto } = await supabase
            .from('votos_posts')
            .select('tipo_voto')
            .eq('post_id', postId)
            .eq('user_id', currentUser.id)
            .maybeSingle();
        meuVotoPost = voto?.tipo_voto || 0;

        // Votos nos comentários
        const { data: votosComm } = await supabase
            .from('votos_comentarios')
            .select('comentario_id, tipo_voto')
            .eq('user_id', currentUser.id);
        if (votosComm) votosComm.forEach(v => { userCommentVotes[v.comentario_id] = v.tipo_voto; });

        // Preencher avatar e nome na caixa de resposta
        const { data: perfil } = await supabase
            .from('perfis')
            .select('username, avatar_url')
            .eq('id', currentUser.id)
            .maybeSingle();
        const nome = perfil?.username || 'Utilizador';
        const avatarUrl = perfil?.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=2a2a35&color=fff`;
        const imgEl = document.getElementById('replyUserAvatar');
        const nameEl = document.getElementById('replyUserName');
        if (imgEl) imgEl.src = avatarUrl;
        if (nameEl) nameEl.textContent = nome;
    }

    // Carregar post
    await carregarTopico();

    // Contador de caracteres
    const ta = document.getElementById('novoComentario');
    if (ta) {
        ta.addEventListener('input', () => {
            const cc = document.getElementById('charCount');
            if (cc) cc.textContent = ta.value.length;
        });
    }

    // Subscritores Realtime
    initRealtime();

    // Event listener do modal de confirmação
    document.getElementById('btnConfirmAction')?.addEventListener('click', async () => {
        if (!targetToDelete) return;
        const { type, id } = targetToDelete;
        fecharConfirmModal();
        if (type === 'post') {
            await confirmarApagarPost();
        } else if (type === 'comment') {
            await confirmarApagarComentario(id);
        }
    });
});

let targetToDelete = null;

function abrirConfirmModal(type, id = null) {
    targetToDelete = { type, id };
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    
    if (type === 'post') {
        if (msg) msg.textContent = 'Tens a certeza que queres apagar este tópico permanentemente?';
    } else {
        if (msg) msg.textContent = 'Tens a certeza que queres apagar esta resposta permanentemente?';
    }
    
    if (modal) modal.classList.add('open');
}

function fecharConfirmModal() {
    targetToDelete = null;
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('open');
}

// ── Carregar Tópico ───────────────────────────────────────────────
async function carregarTopico() {
    try {
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

        if (error || !post) { mostrarErro(); return; }

        renderPost(post);
        await carregarComentarios();

        // Mostrar interface
        document.getElementById('topicoLoading').style.display = 'none';
        document.getElementById('topicoWrapper').style.display = '';

        // Mostrar/ocultar caixa de resposta
        if (currentUser) {
            document.getElementById('replyBox').style.display = '';
            document.getElementById('loginAviso').style.display = 'none';
        } else {
            document.getElementById('replyBox').style.display = 'none';
            document.getElementById('loginAviso').style.display = '';
        }

    } catch (err) {
        console.error('Erro ao carregar tópico:', err);
        mostrarErro();
    }
}

// ── Renderizar Post Principal ─────────────────────────────────────
function renderPost(post) {
    const tipo = TIPOS[post.tipo] || TIPOS.outro;
    const nomeUser = escapeHtml(post.perfis?.username || 'Utilizador');
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
    const avatar = post.perfis?.avatar_url || defaultAvatar;
    const scoreClass = post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : '';

    // Atualizar título da página e breadcrumb
    document.title = `${post.titulo} — Projeto Gênesis`;
    const bcCateg = document.getElementById('breadcrumbCategoria');
    const bcTitulo = document.getElementById('breadcrumbTitulo');
    if (bcCateg) bcCateg.textContent = `${tipo.emoji} ${tipo.label}`;
    if (bcTitulo) bcTitulo.textContent = post.titulo.length > 50 ? post.titulo.slice(0, 50) + '…' : post.titulo;

    // Referência a ficha/campanha
    let refHtml = '';
    if (post.personagens) {
        refHtml = `<div class="topico-referencia" onclick="window.open('visualizar-ficha.html?id=${post.personagem_id}&view=true','_blank')">
            🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')}
            <span style="opacity:0.6; font-size:0.85em;">(🔎 Ver ficha)</span>
        </div>`;
    } else if (post.campanhas) {
        refHtml = `<div class="topico-referencia" onclick="window.open('visualizar-campanha-jogador.html?id=${post.campanha_id}&view=true','_blank')">
            🎭 Campanha: ${escapeHtml(post.campanhas.nome)}
            <span style="opacity:0.6; font-size:0.85em;">(🔎 Ver campanha)</span>
        </div>`;
    }

    // Acções de editar/apagar
    const isOwner = currentUser && post.user_id === currentUser.id;
    let actionsHtml = '';
    if (isOwner || isAdmin) {
        actionsHtml = `
        <div class="topico-post-actions">
            ${isOwner ? `<button class="topico-action-btn" onclick="editarPost()">✏️ Editar</button>` : ''}
            ${(isOwner || isAdmin) ? `<button class="topico-action-btn danger" onclick="abrirConfirmModal('post')">🗑️ Apagar</button>` : ''}
        </div>`;
    }

    const container = document.getElementById('postPrincipal');
    container.style.setProperty('--tipo-color', tipo.cor);
    container.innerHTML = `
        <div class="topico-post-header">
            <a href="perfil.html?id=${post.user_id}"><img class="topico-post-avatar" src="${avatar}" alt="${nomeUser}"
                onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer"></a>
            <div class="topico-post-meta">
                <div class="topico-post-autor"><a href="perfil.html?id=${post.user_id}" style="color:white;text-decoration:none;">${nomeUser}</a></div>
                <div class="topico-post-data">${formatarData(post.criado_em)}</div>
            </div>
            <span class="topico-tipo-tag tipo-${post.tipo}">${tipo.emoji} ${tipo.label}</span>
        </div>
        <h1 class="topico-titulo">${escapeHtml(post.titulo)}</h1>
        ${refHtml}
        <div class="topico-conteudo" style="margin-top: 20px;">${marked.parse(post.conteudo)}</div>
        <div class="topico-post-footer">
            <div class="topico-vote-group">
                <button class="topico-vote-btn upvote ${meuVotoPost === 1 ? 'active' : ''}"
                    onclick="votarPost(1)" title="Gosto">▲</button>
                <span class="topico-score ${scoreClass}" id="topicoScore">${post.score}</span>
                <button class="topico-vote-btn downvote ${meuVotoPost === -1 ? 'active' : ''}"
                    onclick="votarPost(-1)" title="Não gosto">▼</button>
            </div>
            ${actionsHtml}
        </div>
    `;
}

// ── Carregar Comentários ──────────────────────────────────────────
async function carregarComentarios() {
    try {
        let query = supabase
            .from('comentarios_posts')
            .select(`
                id, texto, criado_em, user_id, score, parent_id,
                perfis:user_id ( username, avatar_url )
            `)
            .eq('post_id', postId);

        if (ordemComentarios === 'votados') {
            query = query.order('score', { ascending: false }).order('criado_em', { ascending: true });
        } else {
            query = query.order('criado_em', { ascending: true });
        }

        const { data, error } = await query;
        if (error) throw error;

        const lista = document.getElementById('repliesList');
        const countEl = document.getElementById('repliesCount');
        if (countEl) countEl.textContent = (data || []).length;
        if (!lista) return;

        lista.innerHTML = '';
        renderComentarios(data || [], lista);

    } catch (err) {
        console.error('Erro ao carregar comentários:', err);
    }
}

function renderComentarios(allComments, container) {
    if (!allComments.length) return;

    allComments.forEach(c => {
        const nomeUser = escapeHtml(c.perfis?.username || 'Utilizador');
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
        const avatar = c.perfis?.avatar_url || defaultAvatar;
        const meuVoto = userCommentVotes[c.id] || 0;
        const score = c.score || 0;
        const scoreClass = score > 0 ? 'positive' : score < 0 ? 'negative' : '';
        const isOwner = currentUser && c.user_id === currentUser.id;
        const canDelete = isOwner || isAdmin;

        // Menu de acções
        let menuHtml = '';
        if (isOwner || canDelete) {
            menuHtml = `
            <div class="reply-actions-wrapper">
                <button class="btn-actions-toggle" onclick="toggleMenu(event,'menu-${c.id}')">⋮</button>
                <div id="menu-${c.id}" class="actions-menu">
                    ${isOwner ? `<button class="action-item" onclick="editarComentario('${c.id}')">✏️ Editar</button>` : ''}
                    ${canDelete ? `<button class="action-item delete" onclick="abrirConfirmModal('comment', '${c.id}')">🗑️ Apagar</button>` : ''}
                </div>
            </div>`;
        }

        const div = document.createElement('div');
        div.className = 'reply-item';
        div.id = `reply-${c.id}`;
        
        let textoHtml = escapeHtml(c.texto);
        textoHtml = textoHtml.replace(/^(@[^\s]+\s)/, '<span class="reply-citation" style="color: var(--primary); font-weight: 500;">$1</span>');

        div.innerHTML = `
            ${menuHtml}
            <div class="reply-item-header">
                <a href="perfil.html?id=${c.user_id}"><img class="reply-avatar" src="${avatar}" alt="${nomeUser}"
                    onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer"></a>
                <div>
                    <div class="reply-author-name"><a href="perfil.html?id=${c.user_id}" style="color:white;text-decoration:none;">${nomeUser}</a></div>
                </div>
                <span class="reply-date">${formatarData(c.criado_em)}</span>
            </div>
            <div class="reply-texto" id="reply-text-${c.id}" data-raw-text="${escapeHtml(c.texto)}">${textoHtml}</div>
            <div class="reply-footer">
                <div class="reply-votes-group">
                    <span class="reply-vote-link up ${meuVoto === 1 ? 'active' : ''}"
                        onclick="votarComentario('${c.id}', 1)">▲</span>
                    <span class="reply-score-val ${scoreClass} score-comm-val-${c.id}">${score}</span>
                    <span class="reply-vote-link down ${meuVoto === -1 ? 'active' : ''}"
                        onclick="votarComentario('${c.id}', -1)">▼</span>
                </div>
                ${currentUser ? `<button class="btn-reply-reply" onclick="abrirReplyInline('${c.id}', '${nomeUser}')">↩ Responder</button>` : ''}
            </div>
            <div id="reply-inline-${c.id}"></div>
        `;

        container.appendChild(div);
    });
}

// ── Votação no Post ───────────────────────────────────────────────
async function votarPost(tipoVoto) {
    if (!currentUser) { mostrarToast('Faz login para votar! 🔐', 'error'); return; }
    if (isVoting[postId]) return;
    isVoting[postId] = true;

    const scoreEl = document.getElementById('topicoScore');
    const currentScore = parseInt(scoreEl?.textContent || '0');
    const scoreDiff = tipoVoto === meuVotoPost ? -meuVotoPost : (tipoVoto - meuVotoPost);
    const novoScore = currentScore + scoreDiff;
    const novoVoto = tipoVoto === meuVotoPost ? 0 : tipoVoto;

    // UI otimista
    if (scoreEl) {
        scoreEl.textContent = novoScore;
        scoreEl.className = `topico-score ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''}`;
    }
    document.querySelectorAll('.topico-vote-btn.upvote').forEach(b => b.classList.toggle('active', novoVoto === 1));
    document.querySelectorAll('.topico-vote-btn.downvote').forEach(b => b.classList.toggle('active', novoVoto === -1));

    try {
        if (meuVotoPost === tipoVoto) {
            await supabase.from('votos_posts').delete().eq('post_id', postId).eq('user_id', currentUser.id);
        } else {
            await supabase.from('votos_posts').upsert(
                { post_id: postId, user_id: currentUser.id, tipo_voto: tipoVoto },
                { onConflict: 'post_id,user_id' }
            );
        }
        meuVotoPost = novoVoto;
    } catch (err) {
        mostrarToast('Erro ao votar.', 'error');
    } finally {
        isVoting[postId] = false;
    }
}

// ── Votação nos Comentários ───────────────────────────────────────
async function votarComentario(commentId, tipoVoto) {
    if (!currentUser) { mostrarToast('Faz login para votar! 🔐', 'error'); return; }
    if (isVoting[commentId]) return;
    isVoting[commentId] = true;

    const votoAtual = userCommentVotes[commentId] || 0;
    const scoreEl = document.querySelector(`.score-comm-val-${commentId}`);
    if (!scoreEl) { isVoting[commentId] = false; return; }

    const currentScore = parseInt(scoreEl.textContent || '0');
    const scoreDiff = tipoVoto === votoAtual ? -votoAtual : (tipoVoto - votoAtual);
    const novoScore = currentScore + scoreDiff;
    const novoVoto = tipoVoto === votoAtual ? 0 : tipoVoto;

    // UI otimista
    scoreEl.textContent = novoScore;
    scoreEl.className = `reply-score-val ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''} score-comm-val-${commentId}`;
    const group = scoreEl.closest('.reply-votes-group');
    if (group) {
        group.querySelector('.up')?.classList.toggle('active', novoVoto === 1);
        group.querySelector('.down')?.classList.toggle('active', novoVoto === -1);
    }

    try {
        if (votoAtual === tipoVoto) {
            await supabase.from('votos_comentarios').delete().eq('comentario_id', commentId).eq('user_id', currentUser.id);
        } else {
            await supabase.from('votos_comentarios').upsert(
                { comentario_id: commentId, user_id: currentUser.id, tipo_voto: tipoVoto },
                { onConflict: 'comentario_id,user_id' }
            );
        }
        userCommentVotes[commentId] = novoVoto;
    } catch (err) {
        mostrarToast('Erro ao votar.', 'error');
    } finally {
        isVoting[commentId] = false;
    }
}

// ── Enviar Comentário Principal ────────────────────────────────────
async function enviarComentario() {
    if (!currentUser) { mostrarToast('Faz login para comentar.', 'error'); return; }
    const ta = document.getElementById('novoComentario');
    const texto = ta.value.trim();
    if (!texto) return;

    const btn = document.getElementById('btnEnviarResposta');
    btn.disabled = true;

    try {
        const { error } = await supabase.from('comentarios_posts').insert({
            post_id: postId, user_id: currentUser.id, texto
        });
        if (error) throw error;
        ta.value = '';
        ta.style.height = 'auto';
        document.getElementById('charCount').textContent = '0';
        await carregarComentarios();
        mostrarToast('Resposta publicada! 💬', 'success');
        // Scroll para a lista de respostas
        document.getElementById('repliesList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        mostrarToast('Erro ao publicar resposta.', 'error');
    } finally {
        btn.disabled = false;
    }
}

// ── Reply Inline ──────────────────────────────────────────────────
function abrirReplyInline(commentId, nomeUser = '') {
    // Fechar outros inline abertos
    document.querySelectorAll('[id^="reply-inline-"]').forEach(el => el.innerHTML = '');

    const area = document.getElementById(`reply-inline-${commentId}`);
    if (!area) return;

    const citationText = nomeUser ? `@${nomeUser} ` : '';

    area.innerHTML = `
        <div class="reply-inline-area">
            <textarea id="inline-ta-${commentId}" placeholder="Escreve a tua resposta…" rows="2">${citationText}</textarea>
            <div class="reply-inline-actions">
                <button class="btn-reply-cancel" onclick="fecharReplyInline('${commentId}')">Cancelar</button>
                <button class="btn-reply-send-inline" onclick="enviarReplyInline('${commentId}')">↩ Responder</button>
            </div>
        </div>
    `;
    const ta = area.querySelector('textarea');
    if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
    }
}

function fecharReplyInline(commentId) {
    const area = document.getElementById(`reply-inline-${commentId}`);
    if (area) area.innerHTML = '';
}

async function enviarReplyInline(commentId) {
    const ta = document.getElementById(`inline-ta-${commentId}`);
    const texto = ta?.value.trim();
    if (!texto) return;

    try {
        const { error } = await supabase.from('comentarios_posts').insert({
            post_id: postId, user_id: currentUser.id, texto
        });
        if (error) throw error;
        fecharReplyInline(commentId);
        await carregarComentarios();
        mostrarToast('Resposta enviada! ⤴️', 'success');
    } catch (err) {
        mostrarToast('Erro ao enviar resposta.', 'error');
    }
}

// ── Apagar / Editar Post ──────────────────────────────────────────
async function confirmarApagarPost() {
    try {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) throw error;
        mostrarToast('Tópico apagado.', 'success');
        setTimeout(() => { window.location.href = 'comunidade.html'; }, 1200);
    } catch (err) {
        mostrarToast('Erro ao apagar.', 'error');
    }
}

async function editarPost() {
    window.location.href = `criar-topico.html?edit=${postId}`;
}

// ── Apagar / Editar Comentário ────────────────────────────────────
async function confirmarApagarComentario(commentId) {
    try {
        const { error } = await supabase.from('comentarios_posts').delete().eq('id', commentId);
        if (error) throw error;
        mostrarToast('Resposta apagada.', 'success');
        await carregarComentarios();
    } catch (err) {
        mostrarToast('Erro ao apagar.', 'error');
    }
}

function editarComentario(commentId) {
    const textEl = document.getElementById(`reply-text-${commentId}`);
    if (!textEl) return;
    
    if (document.getElementById(`edit-ta-${commentId}`)) return;

    const currentText = textEl.getAttribute('data-raw-text') || textEl.textContent || '';

    const area = document.createElement('div');
    area.className = 'reply-inline-area';
    area.style.marginTop = '10px';
    area.innerHTML = `
        <textarea id="edit-ta-${commentId}" rows="3">${escapeHtml(currentText)}</textarea>
        <div class="reply-inline-actions">
            <button class="btn-reply-cancel" onclick="cancelarEdicaoComentario('${commentId}')">Cancelar</button>
            <button class="btn-reply-send-inline" onclick="salvarEdicaoComentario('${commentId}')">💾 Guardar</button>
        </div>
    `;

    textEl.style.display = 'none';
    textEl.parentNode.insertBefore(area, textEl.nextSibling);

    const ta = document.getElementById(`edit-ta-${commentId}`);
    if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
    }
}

function cancelarEdicaoComentario(commentId) {
    const textEl = document.getElementById(`reply-text-${commentId}`);
    const taArea = document.getElementById(`edit-ta-${commentId}`)?.parentNode;
    if (textEl && taArea) {
        textEl.style.display = '';
        taArea.remove();
    }
}

async function salvarEdicaoComentario(commentId) {
    const ta = document.getElementById(`edit-ta-${commentId}`);
    if (!ta) return;
    const novoTexto = ta.value.trim();
    const textEl = document.getElementById(`reply-text-${commentId}`);
    const currentText = textEl ? (textEl.getAttribute('data-raw-text') || textEl.textContent).trim() : '';

    if (!novoTexto) {
        mostrarToast('A resposta não pode estar vazia.', 'error');
        return;
    }

    if (novoTexto === currentText) {
        cancelarEdicaoComentario(commentId);
        return;
    }

    try {
        const { error } = await supabase.from('comentarios_posts').update({
            texto: novoTexto
        }).eq('id', commentId);
        if (error) throw error;
        mostrarToast('Resposta atualizada.', 'success');
        await carregarComentarios();
    } catch (err) {
        mostrarToast('Erro ao editar.', 'error');
    }
}

// ── Ordenar Comentários ───────────────────────────────────────────
function mudarOrdemComentarios(ordem, btn) {
    ordemComentarios = ordem;
    document.querySelectorAll('.reply-sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    carregarComentarios();
}

// ── Menu de 3 pontos ──────────────────────────────────────────────
function toggleMenu(event, menuId) {
    event.stopPropagation();
    const menu = document.getElementById(menuId);
    const isOpen = menu.classList.contains('show');
    document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('show'));
    if (!isOpen) menu.classList.add('show');
    const close = () => { menu.classList.remove('show'); document.removeEventListener('click', close); };
    document.addEventListener('click', close);
}

// ── Realtime ──────────────────────────────────────────────────────
function initRealtime() {
    supabase.channel('topico:comentarios')
        .on('postgres_changes', {
            event: '*', schema: 'public', table: 'comentarios_posts',
            filter: `post_id=eq.${postId}`
        }, () => carregarComentarios())
        .subscribe();

    supabase.channel('topico:score')
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'posts',
            filter: `id=eq.${postId}`
        }, payload => {
            const scoreEl = document.getElementById('topicoScore');
            if (scoreEl) {
                const s = payload.new.score;
                scoreEl.textContent = s;
                scoreEl.className = `topico-score ${s > 0 ? 'positive' : s < 0 ? 'negative' : ''}`;
            }
        })
        .subscribe();
}

// ── Erro ──────────────────────────────────────────────────────────
function mostrarErro() {
    document.getElementById('topicoLoading').style.display = 'none';
    document.getElementById('topicoErro').style.display = '';
}

// ── Utilitários ───────────────────────────────────────────────────
function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
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
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast-comunidade ${tipo} show`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

window.loginWithGoogle = () => window.auth?.loginWithGoogle();
window.mudarOrdemComentarios = mudarOrdemComentarios;
window.votarPost = votarPost;
window.votarComentario = votarComentario;
window.enviarComentario = enviarComentario;
window.abrirReplyInline = abrirReplyInline;
window.fecharReplyInline = fecharReplyInline;
window.enviarReplyInline = enviarReplyInline;
window.abrirConfirmModal = abrirConfirmModal;
window.fecharConfirmModal = fecharConfirmModal;
window.editarPost = editarPost;
window.editarComentario = editarComentario;
window.cancelarEdicaoComentario = cancelarEdicaoComentario;
window.salvarEdicaoComentario = salvarEdicaoComentario;
window.toggleMenu = toggleMenu;
