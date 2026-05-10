// ================================================================
// PERFIL.JS — Perfil Público de Utilizador
// ================================================================

let targetUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    targetUserId = params.get('id');

    if (!targetUserId) {
        mostrarErro();
        return;
    }

    await carregarPerfil();
});

async function carregarPerfil() {
    try {
        // 1. Carregar dados básicos do perfil
        const { data: perfil, error } = await supabase
            .from('perfis')
            .select('id, username, bio, avatar_url')
            .eq('id', targetUserId)
            .maybeSingle();

        if (error || !perfil) {
            mostrarErro();
            return;
        }

        // Preencher UI
        const nome = perfil.username || 'Utilizador';
        const avatarUrl = perfil.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=2a2a35&color=fff`;

        document.getElementById('pAvatar').src = avatarUrl;
        document.getElementById('pAvatar').onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=2a2a35&color=fff`;
        };
        document.getElementById('pName').textContent = nome;
        document.getElementById('pBio').textContent = perfil.bio || 'Nenhuma bio definida.';

        document.title = `${nome} - Perfil | Projeto Gênesis`;

        // 2. Carregar Posts e Score (Reputação)
        const { data: posts } = await supabase
            .from('posts')
            .select('id, titulo, tipo, score, criado_em')
            .eq('user_id', targetUserId)
            .order('criado_em', { ascending: false });

        let reputacao = 0;
        let htmlPosts = '';

        if (posts && posts.length > 0) {
            posts.forEach(p => {
                reputacao += (p.score || 0);
                const scoreColor = p.score > 0 ? '#10b981' : (p.score < 0 ? '#ef4444' : '#6b7280');
                
                htmlPosts += `
                    <a href="topico.html?id=${p.id}" class="p-post-item">
                        <div>
                            <div class="p-post-title">${escapeHtml(p.titulo)}</div>
                            <div class="p-post-meta">Publicado em ${formatarData(p.criado_em)}</div>
                        </div>
                        <div class="p-post-score" style="color: ${scoreColor}">▲ ${p.score || 0}</div>
                    </a>
                `;
            });
        } else {
            htmlPosts = '<p style="color: rgba(255,255,255,0.4);">Este utilizador ainda não publicou tópicos.</p>';
        }

        document.getElementById('pStatPosts').textContent = posts ? posts.length : 0;
        document.getElementById('pStatScore').textContent = reputacao;
        document.getElementById('listaPosts').innerHTML = htmlPosts;

        // 3. Carregar Personagens (Fichas)
        const { data: fichas } = await supabase
            .from('personagens')
            .select('id, nome, raca, nivel')
            .eq('perfil_id', targetUserId)
            .eq('is_public', true)
            .order('criado_em', { ascending: false });

        let htmlFichas = '';
        if (fichas && fichas.length > 0) {
            fichas.forEach(f => {
                htmlFichas += `
                    <a href="visualizar-ficha.html?id=${f.id}&view=true" class="p-card">
                        <div class="p-card-title">🧙‍♂️ ${escapeHtml(f.nome)}</div>
                        <div class="p-card-subtitle">Nível ${f.nivel || '?'} · ${escapeHtml(f.raca || '?')}</div>
                    </a>
                `;
            });
        } else {
            htmlFichas = '<p style="color: rgba(255,255,255,0.4);">Nenhuma personagem pública.</p>';
        }
        document.getElementById('listaFichas').innerHTML = htmlFichas;

        // 4. Carregar Campanhas
        const { data: campanhas } = await supabase
            .from('campanhas')
            .select('id, nome, descricao')
            .eq('narrador_id', targetUserId)
            .eq('is_public', true)
            .order('criada_em', { ascending: false });

        let htmlCampanhas = '';
        if (campanhas && campanhas.length > 0) {
            campanhas.forEach(c => {
                const desc = c.descricao ? (c.descricao.length > 60 ? c.descricao.substring(0, 60) + '...' : c.descricao) : 'Sem descrição';
                htmlCampanhas += `
                    <div class="p-card" style="cursor: default;">
                        <div class="p-card-title">🌍 ${escapeHtml(c.nome)}</div>
                        <div class="p-card-subtitle">${escapeHtml(desc)}</div>
                    </div>
                `;
            });
        } else {
            htmlCampanhas = '<p style="color: rgba(255,255,255,0.4);">Nenhuma campanha pública.</p>';
        }
        document.getElementById('listaCampanhas').innerHTML = htmlCampanhas;

        // Finalizar Loading
        document.getElementById('perfilLoading').style.display = 'none';
        document.getElementById('perfilWrapper').style.display = 'block';

    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        mostrarErro();
    }
}

function mudarAba(abaId) {
    document.querySelectorAll('.p-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.p-aba-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`.p-tab[onclick="mudarAba('${abaId}')"]`).classList.add('active');
    document.getElementById(`aba-${abaId}`).classList.add('active');
}

function mostrarErro() {
    document.getElementById('perfilLoading').style.display = 'none';
    document.getElementById('perfilErro').style.display = 'block';
}

function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatarData(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}
