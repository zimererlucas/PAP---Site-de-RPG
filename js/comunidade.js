// ================================================================
// COMUNIDADE.JS — Sistema de Comunidade · Projeto Gênesis
// ================================================================

// ─── Estado Global ────────────────────────────────────────────
const POSTS_PER_PAGE = 20;
let   feedOrdem       = 'score_desc'; // score_desc | score_asc
let   feedSearchDebounce = null;
let   feedOffset      = 0;
let   feedEsgotado    = false;
let   feedCarregando  = false;
let   postAtualId     = null;    // id do post aberto no detalhe
let   currentUser     = null;    // utilizador supabase
let   userVotes       = {};      // { post_id: tipo_voto }
let   userCommentVotes = {};     // { comment_id: tipo_voto }
let   isVoting        = {};      // { id: true/false } para evitar spam
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

// ─── Função de Processamento Markdown Básico ──────────────────
function processarMarkdownBasico(texto) {
    if (!texto) return '';

    return texto
        // Headers (h1-h3)
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')

        // Negrito e itálico
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

        // Código inline
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // Links [texto](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

        // Quebras de linha
        .replace(/\n/g, '<br>')

        // Limpar tags HTML potencialmente perigosas (básico)
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '');
}

// ─── Função para criar preview do conteúdo ────────────────────
function criarPreviewConteudo(conteudo, maxLength = 200) {
    if (!conteudo) return '';

    // Remover markdown para preview limpo
    const textoLimpo = conteudo
        .replace(/^###?\s*/gm, '') // headers
        .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // bold+italic
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1') // italic
        .replace(/`([^`]+)`/g, '$1') // code
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // links
        .replace(/\n+/g, ' ') // quebras de linha
        .trim();

    if (textoLimpo.length <= maxLength) {
        return processarMarkdownBasico(conteudo);
    }

    // Cortar no limite e adicionar "..."
    const cortado = textoLimpo.substring(0, maxLength);
    const ultimoEspaco = cortado.lastIndexOf(' ');
    const preview = ultimoEspaco > 0 ? cortado.substring(0, ultimoEspaco) : cortado;

    return processarMarkdownBasico(preview + '...');
}

// ─── Função para inserir formatação no textarea ───────────────
function insertFormat(before, after) {
    const textarea = document.getElementById('postConteudo');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = before + selectedText + after;

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();

    // Reposicionar cursor
    const newCursorPos = start + before.length + selectedText.length + after.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
}

// ─── Função para visualizar ficha (somente leitura) ────────────
async function visualizarFicha(personagemId) {
    // Impedir que o clique no card do post seja acionado
    event?.stopPropagation();

    // Verificar se o ID é válido
    if (!personagemId || personagemId === 'null' || personagemId === 'undefined') {
        console.error('ID de personagem inválido:', personagemId);
        mostrarToast('Ficha não encontrada.', 'error');
        return;
    }

    // Abrir modal de visualização de ficha
    const modal = document.getElementById('modalVisualizarFicha');
    if (!modal) {
        console.error('Modal de visualização de ficha não encontrado');
        return;
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const fichaDiv = document.getElementById('fichaConteudo');
    fichaDiv.innerHTML = '<div class="feed-loading"><div class="spinner"></div></div>';

    try {
        // Carregar dados da ficha
        const { data: ficha, error } = await supabase
            .from('personagens')
            .select('*')
            .eq('id', personagemId)
            .single();

        if (error) {
            console.error('Erro ao carregar ficha:', error);
            throw error;
        }

        // Carregar dados do perfil do criador
        let perfil = null;
        if (ficha.perfil_id) {
            const { data: perfilData, error: perfilError } = await supabase
                .from('perfis')
                .select('username, avatar_url')
                .eq('id', ficha.perfil_id)
                .single();

            if (!perfilError) {
                perfil = perfilData;
            }
        }

        // Adicionar dados do perfil à ficha
        ficha.perfis = perfil;

        // Carregar dados relacionados da ficha
        const [habilidadesResult, magiasResult, conhecimentosResult, inventarioResult, anotacoesResult] = await Promise.all([
            supabase.from('habilidades').select('*').eq('personagem_id', personagemId).order('nome'),
            supabase.from('magias').select('*').eq('personagem_id', personagemId).order('nome'),
            supabase.from('conhecimentos').select('*').eq('personagem_id', personagemId).order('nome'),
            supabase.from('inventario').select('*').eq('personagem_id', personagemId).order('nome'),
            supabase.from('anotacoes').select('*').eq('personagem_id', personagemId).order('titulo')
        ]);

        const habilidades = habilidadesResult.data || [];
        const magias = magiasResult.data || [];
        const conhecimentos = conhecimentosResult.data || [];
        const inventario = inventarioResult.data || [];
        const anotacoes = anotacoesResult.data || [];

        // Renderizar ficha em modo somente leitura (igual à página de fichas)
        fichaDiv.innerHTML = `
            <div class="ficha-container" style="max-width: 100%; margin: 0; padding: 20px; background: var(--card-bg); border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); border: 1px solid var(--glass-border); backdrop-filter: blur(8px);">

                <!-- Cabeçalho da Ficha -->
                <div class="ficha-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid var(--accent);">
                    <div class="ficha-header-left" style="flex: 1;">
                        <h1 id="nomePersonagemHeader" style="margin: 0; font-size: 2em; font-weight: 700; color: #fff;">${escapeHtml(ficha.nome)}</h1>
                        <p style="margin: 5px 0 0 0; color: var(--muted); font-size: 1.05em;">${escapeHtml(ficha.raca || 'Raça não definida')}</p>
                    </div>
                    <div class="ficha-header-right" style="text-align: right;">
                        <div style="font-size: 1.2em; color: var(--accent); font-weight: 700;">Nível ${ficha.nivel || 1}</div>
                    </div>
                </div>

                <!-- Conteúdo principal -->
                <div class="ficha-main" style="display: flex; flex-direction: column; gap: 30px;">

                    <!-- Grid para a linha superior: 2 colunas (Info+Atributos | Status) -->
                    <div class="ficha-top-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">

                        <!-- Coluna Esquerda: Informações + Atributos -->
                        <div>

                            <!-- Informações Básicas -->
                            <div style="margin-bottom: 30px;">
                                <h3 style="color: var(--accent); margin-bottom: 15px; font-size: 1.2em;">📊 Informações Básicas</h3>
                                <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <div class="info-item" style="background: rgba(0, 0, 0, 0.28); padding: 12px; border-radius: 6px; border-left: 3px solid var(--accent);">
                                        <div class="info-item-label" style="font-size: 0.8em; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 5px;">Classe</div>
                                        <div class="info-item-value" style="font-size: 1.1em; color: #fff; font-weight: 600;">${escapeHtml(ficha.classe || 'Não definida')}</div>
                                    </div>
                                    <div class="info-item" style="background: rgba(0, 0, 0, 0.28); padding: 12px; border-radius: 6px; border-left: 3px solid var(--accent);">
                                        <div class="info-item-label" style="font-size: 0.8em; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 5px;">Idade</div>
                                        <div class="info-item-value" style="font-size: 1.1em; color: #fff; font-weight: 600;">${ficha.idade || 'Não definida'}</div>
                                    </div>
                                    <div class="info-item" style="background: rgba(0, 0, 0, 0.28); padding: 12px; border-radius: 6px; border-left: 3px solid var(--accent);">
                                        <div class="info-item-label" style="font-size: 0.8em; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 5px;">Altura</div>
                                        <div class="info-item-value" style="font-size: 1.1em; color: #fff; font-weight: 600;">${ficha.altura || 'Não definida'}</div>
                                    </div>
                                    <div class="info-item" style="background: rgba(0, 0, 0, 0.28); padding: 12px; border-radius: 6px; border-left: 3px solid var(--accent);">
                                        <div class="info-item-label" style="font-size: 0.8em; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 5px;">Peso</div>
                                        <div class="info-item-value" style="font-size: 1.1em; color: #fff; font-weight: 600;">${ficha.peso || 'Não definido'}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Atributos -->
                            <div>
                                <h3 style="color: var(--accent); margin-bottom: 15px; font-size: 1.2em;">⚔️ Atributos</h3>
                                <div class="atributos-list" style="display: flex; flex-direction: column; gap: 8px;">
                                    <div class="atributo-row" style="display: grid; grid-template-columns: 30px 1fr 1fr; gap: 10px; align-items: center; padding: 8px; background: rgba(0, 0, 0, 0.28); border-radius: 6px; border-left: 2px solid var(--accent);">
                                        <div class="atributo-emoji" style="font-size: 1.2em; text-align: center;">💪</div>
                                        <div class="atributo-nome" style="font-size: 0.9em; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Força</div>
                                        <div class="atributo-calculo" style="font-size: 0.85em; color: var(--accent); text-align: right; font-weight: 600;">${ficha.forca || 0}</div>
                                    </div>
                                    <div class="atributo-row" style="display: grid; grid-template-columns: 30px 1fr 1fr; gap: 10px; align-items: center; padding: 8px; background: rgba(0, 0, 0, 0.28); border-radius: 6px; border-left: 2px solid var(--accent);">
                                        <div class="atributo-emoji" style="font-size: 1.2em; text-align: center;">🏃</div>
                                        <div class="atributo-nome" style="font-size: 0.9em; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Destreza</div>
                                        <div class="atributo-calculo" style="font-size: 0.85em; color: var(--accent); text-align: right; font-weight: 600;">${ficha.destreza || 0}</div>
                                    </div>
                                    <div class="atributo-row" style="display: grid; grid-template-columns: 30px 1fr 1fr; gap: 10px; align-items: center; padding: 8px; background: rgba(0, 0, 0, 0.28); border-radius: 6px; border-left: 2px solid var(--accent);">
                                        <div class="atributo-emoji" style="font-size: 1.2em; text-align: center;">🛡️</div>
                                        <div class="atributo-nome" style="font-size: 0.9em; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Constituição</div>
                                        <div class="atributo-calculo" style="font-size: 0.85em; color: var(--accent); text-align: right; font-weight: 600;">${ficha.constituicao || 0}</div>
                                    </div>
                                    <div class="atributo-row" style="display: grid; grid-template-columns: 30px 1fr 1fr; gap: 10px; align-items: center; padding: 8px; background: rgba(0, 0, 0, 0.28); border-radius: 6px; border-left: 2px solid var(--accent);">
                                        <div class="atributo-emoji" style="font-size: 1.2em; text-align: center;">🧠</div>
                                        <div class="atributo-nome" style="font-size: 0.9em; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Inteligência</div>
                                        <div class="atributo-calculo" style="font-size: 0.85em; color: var(--accent); text-align: right; font-weight: 600;">${ficha.inteligencia || 0}</div>
                                    </div>
                                    <div class="atributo-row" style="display: grid; grid-template-columns: 30px 1fr 1fr; gap: 10px; align-items: center; padding: 8px; background: rgba(0, 0, 0, 0.28); border-radius: 6px; border-left: 2px solid var(--accent);">
                                        <div class="atributo-emoji" style="font-size: 1.2em; text-align: center;">🎯</div>
                                        <div class="atributo-nome" style="font-size: 0.9em; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Sabedoria</div>
                                        <div class="atributo-calculo" style="font-size: 0.85em; color: var(--accent); text-align: right; font-weight: 600;">${ficha.sabedoria || 0}</div>
                                    </div>
                                    <div class="atributo-row" style="display: grid; grid-template-columns: 30px 1fr 1fr; gap: 10px; align-items: center; padding: 8px; background: rgba(0, 0, 0, 0.28); border-radius: 6px; border-left: 2px solid var(--accent);">
                                        <div class="atributo-emoji" style="font-size: 1.2em; text-align: center;">🎭</div>
                                        <div class="atributo-nome" style="font-size: 0.9em; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Carisma</div>
                                        <div class="atributo-calculo" style="font-size: 0.85em; color: var(--accent); text-align: right; font-weight: 600;">${ficha.carisma || 0}</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Coluna Direita: Status (Vida, Mana, Estamina) -->
                        <div>

                            <!-- Status -->
                            <h3 style="color: var(--accent); margin-bottom: 15px; font-size: 1.2em;">❤️ Status</h3>

                            <!-- Barra de Vida -->
                            <div class="status-bar" style="margin-bottom: 15px;">
                                <div class="status-bar-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <strong style="color: #fff;">Vida</strong>
                                    <span style="color: var(--muted); font-size: 0.85em;">${ficha.vida || 0} / ${(ficha.vida_maxima || 0) + (ficha.vida_maxima_bonus || 0)}</span>
                                </div>
                                <div class="status-bar-container" style="background: rgba(0, 0, 0, 0.3); border-radius: 6px; height: 24px; overflow: hidden; border: 1px solid #16213e; position: relative;">
                                    <div class="status-bar-fill" style="height: 100%; background: linear-gradient(90deg, #ff4444, #ff6666); position: absolute; top: 0; left: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 700; color: #fff; width: ${Math.round(((ficha.vida || 0) / ((ficha.vida_maxima || 0) + (ficha.vida_maxima_bonus || 0))) * 100)}%;">
                                        <span class="status-percent" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; white-space: nowrap; text-shadow: 0 0 4px rgba(0, 0, 0, 0.8); font-size: 0.75em; font-weight: 700; color: #fff;">${Math.round(((ficha.vida || 0) / ((ficha.vida_maxima || 0) + (ficha.vida_maxima_bonus || 0))) * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Barra de Mana -->
                            <div class="status-bar" style="margin-bottom: 15px;">
                                <div class="status-bar-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <strong style="color: #fff;">Mana</strong>
                                    <span style="color: var(--muted); font-size: 0.85em;">${ficha.mana || 0} / ${(ficha.mana_maxima || 0) + (ficha.mana_maxima_bonus || 0)}</span>
                                </div>
                                <div class="status-bar-container" style="background: rgba(0, 0, 0, 0.3); border-radius: 6px; height: 24px; overflow: hidden; border: 1px solid #16213e; position: relative;">
                                    <div class="status-bar-fill" style="height: 100%; background: linear-gradient(90deg, #4444ff, #6666ff); position: absolute; top: 0; left: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 700; color: #fff; width: ${Math.round(((ficha.mana || 0) / ((ficha.mana_maxima || 0) + (ficha.mana_maxima_bonus || 0))) * 100)}%;">
                                        <span class="status-percent" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; white-space: nowrap; text-shadow: 0 0 4px rgba(0, 0, 0, 0.8); font-size: 0.75em; font-weight: 700; color: #fff;">${Math.round(((ficha.mana || 0) / ((ficha.mana_maxima || 0) + (ficha.mana_maxima_bonus || 0))) * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Barra de Estamina -->
                            <div class="status-bar" style="margin-bottom: 15px;">
                                <div class="status-bar-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <strong style="color: #fff;">Estamina</strong>
                                    <span style="color: var(--muted); font-size: 0.85em;">${ficha.estamina || 0} / ${(ficha.estamina_maxima || 0) + (ficha.estamina_maxima_bonus || 0)}</span>
                                </div>
                                <div class="status-bar-container" style="background: rgba(0, 0, 0, 0.3); border-radius: 6px; height: 24px; overflow: hidden; border: 1px solid #16213e; position: relative;">
                                    <div class="status-bar-fill" style="height: 100%; background: linear-gradient(90deg, #ffaa00, #ffcc00); position: absolute; top: 0; left: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 700; color: #fff; width: ${Math.round(((ficha.estamina || 0) / ((ficha.estamina_maxima || 0) + (ficha.estamina_maxima_bonus || 0))) * 100)}%;">
                                        <span class="status-percent" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; white-space: nowrap; text-shadow: 0 0 4px rgba(0, 0, 0, 0.8); font-size: 0.75em; font-weight: 700; color: #fff;">${Math.round(((ficha.estamina || 0) / ((ficha.estamina_maxima || 0) + (ficha.estamina_maxima_bonus || 0))) * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                    <!-- Abas da Ficha -->
                    <div>

                        <!-- Navbar das Abas -->
                        <div class="ficha-navbar" style="display: flex; gap: 15px; padding: 15px 20px; background: rgba(0, 0, 0, 0.28); border-bottom: 2px solid var(--accent); border-radius: 8px; border: 1px solid #16213e; flex-wrap: wrap; margin-bottom: 15px;">
                            <button class="ficha-navbar-btn active" onclick="switchTabComunidade('magias')" style="padding: 8px 16px; background: var(--accent); border: 2px solid var(--accent); color: white; border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: 600;">🪄 Magias</button>
                            <button class="ficha-navbar-btn" onclick="switchTabComunidade('habilidades')" style="padding: 8px 16px; background: transparent; border: 2px solid var(--accent); color: var(--accent); border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: 600;">⚔️ Habilidades</button>
                            <button class="ficha-navbar-btn" onclick="switchTabComunidade('conhecimentos')" style="padding: 8px 16px; background: transparent; border: 2px solid var(--accent); color: var(--accent); border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: 600;">📚 Conhecimentos</button>
                            <button class="ficha-navbar-btn" onclick="switchTabComunidade('inventario')" style="padding: 8px 16px; background: transparent; border: 2px solid var(--accent); color: var(--accent); border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: 600;">🎒 Inventário</button>
                            <button class="ficha-navbar-btn" onclick="switchTabComunidade('anotacoes')" style="padding: 8px 16px; background: transparent; border: 2px solid var(--accent); color: var(--accent); border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: 600;">📝 Anotações</button>
                        </div>

                        <!-- Conteúdo das Abas -->
                        <div id="tab-magias-comunidade" class="tab-content-comunidade active" style="max-height: 400px; overflow-y: auto; border-radius: 8px; padding: 20px; background: rgba(0, 0, 0, 0.2);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div class="section-title" style="margin: 0; color: var(--accent); font-size: 1.2em;">🪄 Magias</div>
                            </div>
                            <div id="lista-magias-comunidade">
                                ${magias.length > 0 ? magias.map(magia => `
                                    <div class="accordion-item" style="border: 1px solid var(--accent); border-radius: 8px; margin-bottom: 10px; background: rgba(0, 0, 0, 0.28);">
                                        <button class="accordion-header" onclick="toggleAccordionComunidade(this)" style="width: 100%; padding: 15px; background: rgba(0, 0, 0, 0.3); border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                                            <span style="font-weight: bold;">${escapeHtml(magia.nome)} (Nível ${magia.nivel})</span>
                                            <span style="font-size: 12px; color: var(--accent); transition: transform 0.3s ease;">▼</span>
                                        </button>
                                        <div class="accordion-content" style="display: none; padding: 15px; background: rgba(0, 0, 0, 0.2);">
                                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                                                <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.85em;"><strong>Dados:</strong> ${magia.dados || '-'}</div>
                                                <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.85em;"><strong>Mana:</strong> ${magia.custo_mana || 0}</div>
                                                <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.85em;"><strong>Estamina:</strong> ${magia.custo_estamina || 0}</div>
                                            </div>
                                            ${magia.descricao ? `<div style="color: rgba(255,255,255,0.8); line-height: 1.5; margin-top: 10px;">${escapeHtml(magia.descricao)}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('') : '<p style="color: var(--muted);">Nenhuma magia adicionada ainda.</p>'}
                            </div>
                        </div>

                        <div id="tab-habilidades-comunidade" class="tab-content-comunidade" style="max-height: 400px; overflow-y: auto; border-radius: 8px; padding: 20px; background: rgba(0, 0, 0, 0.2);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div class="section-title" style="margin: 0; color: var(--accent); font-size: 1.2em;">⚔️ Habilidades</div>
                            </div>
                            <div id="lista-habilidades-comunidade">
                                ${habilidades.length > 0 ? habilidades.map(habilidade => `
                                    <div class="accordion-item" style="border: 1px solid var(--accent); border-radius: 8px; margin-bottom: 10px; background: rgba(0, 0, 0, 0.28);">
                                        <button class="accordion-header" onclick="toggleAccordionComunidade(this)" style="width: 100%; padding: 15px; background: rgba(0, 0, 0, 0.3); border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                                            <span style="font-weight: bold;">${escapeHtml(habilidade.nome)} (Nível ${habilidade.nivel})</span>
                                            <span style="font-size: 12px; color: var(--accent); transition: transform 0.3s ease;">▼</span>
                                        </button>
                                        <div class="accordion-content" style="display: none; padding: 15px; background: rgba(0, 0, 0, 0.2);">
                                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                                                <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.85em;"><strong>Dados:</strong> ${habilidade.dados || '-'}</div>
                                                <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.85em;"><strong>Estamina:</strong> ${habilidade.custo_estamina || 0}</div>
                                            </div>
                                            ${habilidade.descricao ? `<div style="color: rgba(255,255,255,0.8); line-height: 1.5; margin-top: 10px;">${escapeHtml(habilidade.descricao)}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('') : '<p style="color: var(--muted);">Nenhuma habilidade adicionada ainda.</p>'}
                            </div>
                        </div>

                        <div id="tab-conhecimentos-comunidade" class="tab-content-comunidade" style="max-height: 400px; overflow-y: auto; border-radius: 8px; padding: 20px; background: rgba(0, 0, 0, 0.2);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div class="section-title" style="margin: 0; color: var(--accent); font-size: 1.2em;">📚 Conhecimentos</div>
                            </div>
                            <div id="lista-conhecimentos-comunidade">
                                ${conhecimentos.length > 0 ? conhecimentos.map(conhecimento => `
                                    <div class="accordion-item" style="border: 1px solid var(--accent); border-radius: 8px; margin-bottom: 10px; background: rgba(0, 0, 0, 0.28);">
                                        <button class="accordion-header" onclick="toggleAccordionComunidade(this)" style="width: 100%; padding: 15px; background: rgba(0, 0, 0, 0.3); border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                                            <span style="font-weight: bold;">${escapeHtml(conhecimento.nome)} (Nível ${conhecimento.nivel})</span>
                                            <span style="font-size: 12px; color: var(--accent); transition: transform 0.3s ease;">▼</span>
                                        </button>
                                        <div class="accordion-content" style="display: none; padding: 15px; background: rgba(0, 0, 0, 0.2);">
                                            ${conhecimento.descricao ? `<div style="color: rgba(255,255,255,0.8); line-height: 1.5;">${escapeHtml(conhecimento.descricao)}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('') : '<p style="color: var(--muted);">Nenhum conhecimento adicionado ainda.</p>'}
                            </div>
                        </div>

                        <div id="tab-inventario-comunidade" class="tab-content-comunidade" style="max-height: 400px; overflow-y: auto; border-radius: 8px; padding: 20px; background: rgba(0, 0, 0, 0.2);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div class="section-title" style="margin: 0; color: var(--accent); font-size: 1.2em;">🎒 Inventário</div>
                            </div>
                            <div id="lista-inventario-comunidade">
                                ${inventario.length > 0 ? inventario.map(item => `
                                    <div class="accordion-item" style="border: 1px solid var(--accent); border-radius: 8px; margin-bottom: 10px; background: rgba(0, 0, 0, 0.28);">
                                        <button class="accordion-header" onclick="toggleAccordionComunidade(this)" style="width: 100%; padding: 15px; background: rgba(0, 0, 0, 0.3); border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                                            <span style="font-weight: bold;">${escapeHtml(item.nome)} (x${item.quantidade})</span>
                                            <span style="font-size: 12px; color: var(--accent); transition: transform 0.3s ease;">▼</span>
                                        </button>
                                        <div class="accordion-content" style="display: none; padding: 15px; background: rgba(0, 0, 0, 0.2);">
                                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                                                <div style="background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; font-size: 0.85em;"><strong>Peso:</strong> ${item.peso}kg</div>
                                            </div>
                                            ${item.descricao ? `<div style="color: rgba(255,255,255,0.8); line-height: 1.5; margin-top: 10px;">${escapeHtml(item.descricao)}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('') : '<p style="color: var(--muted);">Nenhum item no inventário ainda.</p>'}
                            </div>
                        </div>

                        <div id="tab-anotacoes-comunidade" class="tab-content-comunidade" style="max-height: 400px; overflow-y: auto; border-radius: 8px; padding: 20px; background: rgba(0, 0, 0, 0.2);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div class="section-title" style="margin: 0; color: var(--accent); font-size: 1.2em;">📝 Anotações</div>
                            </div>
                            <div id="lista-anotacoes-comunidade">
                                ${anotacoes.length > 0 ? anotacoes.map(anotacao => `
                                    <div class="accordion-item" style="border: 1px solid var(--accent); border-radius: 8px; margin-bottom: 10px; background: rgba(0, 0, 0, 0.28);">
                                        <button class="accordion-header" onclick="toggleAccordionComunidade(this)" style="width: 100%; padding: 15px; background: rgba(0, 0, 0, 0.3); border: none; color: #e0e0e0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                                            <span style="font-weight: bold;">${escapeHtml(anotacao.titulo)}</span>
                                            <span style="font-size: 12px; color: var(--accent); transition: transform 0.3s ease;">▼</span>
                                        </button>
                                        <div class="accordion-content" style="display: none; padding: 15px; background: rgba(0, 0, 0, 0.2);">
                                            ${anotacao.descricao ? `<div style="color: rgba(255,255,255,0.8); line-height: 1.5;">${escapeHtml(anotacao.descricao)}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('') : '<p style="color: var(--muted);">Nenhuma anotação adicionada ainda.</p>'}
                            </div>
                        </div>

                    </div>

                </div>

                <!-- Rodapé da Ficha -->
                <div style="padding-top: 16px; border-top: 1px solid var(--glass-border); text-align: center; margin-top: 30px;">
                    <div style="font-size: 0.85rem; color: var(--muted);">
                        Criado por: ${escapeHtml(ficha.perfis?.username || 'Usuário')}
                    </div>
                </div>

            </div>
        `;

    } catch (err) {
        console.error('Erro ao carregar ficha:', err);
        fichaDiv.innerHTML = '<p style="color:rgba(255,255,255,0.4);">Erro ao carregar ficha.</p>';
    }
}

// ============================================
// FUNÇÕES PARA CONTROLE DE ABAS NA VISUALIZAÇÃO DE FICHA
// ============================================

function switchTabComunidade(tabName) {
    // Esconder todos os conteúdos
    document.querySelectorAll('.tab-content-comunidade').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.ficha-navbar-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = 'var(--accent)';
    });

    // Mostrar aba selecionada
    const selectedTab = document.getElementById('tab-' + tabName + '-comunidade');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Ativar botão selecionado
    const selectedBtn = document.querySelector(`[onclick="switchTabComunidade('${tabName}')"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        selectedBtn.style.background = 'var(--accent)';
        selectedBtn.style.color = 'white';
    }
}

function toggleAccordionComunidade(button) {
    const content = button.nextElementSibling;
    const arrow = button.querySelector('span:last-child');

    if (content.style.display === 'block') {
        content.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
}

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
    document.getElementById('modalCriarPost')  ?.addEventListener('click', e => { if (e.target.id === 'modalCriarPost')  fecharModalCriar(); });
    document.getElementById('modalDetalhePost')?.addEventListener('click', e => { if (e.target.id === 'modalDetalhePost') fecharModalDetalhe(); });
    document.getElementById('modalVisualizarFicha')?.addEventListener('click', e => { if (e.target.id === 'modalVisualizarFicha') fecharModalFicha(); });

    // Tecla Escape fecha modais
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { fecharModalCriar(); fecharModalDetalhe(); fecharModalFicha(); }
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
        const umMes     = new Date(agora - 30 * 24 * 3600 * 1000);

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
    if (document.getElementById('modeFeed')?.hidden) return;

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
        const tipoFiltro = document.getElementById('feedTipoFiltro')?.value || '';
        const searchRaw  = document.getElementById('feedSearch')?.value || '';

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

        const scoreAsc = feedOrdem === 'score_asc';
        query = query
            .order('score', { ascending: scoreAsc })
            .order('criado_em', { ascending: false })
            .range(feedOffset, feedOffset + POSTS_PER_PAGE - 1);

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

    const tipo   = TIPOS[post.tipo] || TIPOS.outro;
    const nomeUser = escapeHtml(post.perfis?.username || 'Utilizador');
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
    const avatar = post.perfis?.avatar_url || defaultAvatar;
    const data   = formatarData(post.criado_em);

    // Referência (ficha ou campanha)
    let refHtml = '';
    if (post.personagens && post.personagem_id) {
        refHtml = `<div class="post-referencia" onclick="visualizarFicha('${post.personagem_id}')" style="cursor:pointer;">
            🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')}
            <span class="ref-link">👁️ Ver ficha</span>
        </div>`;
    } else if (post.campanhas) {
        refHtml = `<div class="post-referencia">🎭 Campanha: ${escapeHtml(post.campanhas.nome)}</div>`;
    }

    const scoreClass = post.score > 0 ? 'positive' : post.score < 0 ? 'negative' : '';
    const totalComentarios = post.comentarios_posts?.[0]?.count || 0;

    // Criar preview do conteúdo com markdown
    const conteudoPreview = criarPreviewConteudo(post.conteudo, 250);

    div.innerHTML = `
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
            <div class="post-conteudo">${conteudoPreview}</div>
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
        el.className   = `vote-score ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''} score-val-${postId}`;
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
        if (post.personagens && post.personagem_id) {
            refHtml = `<div class="post-referencia" onclick="visualizarFicha('${post.personagem_id}')" style="cursor:pointer;">
                🧙 ${escapeHtml(post.personagens.nome)} · Nível ${post.personagens.nivel || '?'} · ${escapeHtml(post.personagens.raca || '?')}
                <span class="ref-link">👁️ Ver ficha</span>
            </div>`;
        } else if (post.campanhas) {
            refHtml = `<div class="post-referencia">🎭 Campanha: ${escapeHtml(post.campanhas.nome)}</div>`;
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
            <div class="detail-conteudo">${processarMarkdownBasico(post.conteudo)}</div>
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
                id, texto, criado_em, user_id, score,
                perfis:user_id ( username, avatar_url )
            `)
            .eq('post_id', postId)
            .order('criado_em', { ascending: true });

        if (error) throw error;

        const lista = document.getElementById('comentariosList');
        const count = document.getElementById('comentariosCount');

        count.textContent = (data || []).length;

        if (!data || data.length === 0) {
            lista.innerHTML = '';
            return;
        }

        lista.innerHTML = data.map(c => {
            const nomeUser = escapeHtml(c.perfis?.username || 'Utilizador');
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUser)}&background=2a2a35&color=fff`;
            const avatar = c.perfis?.avatar_url || defaultAvatar;
            const meuVoto = userCommentVotes[c.id] || 0;
            const scoreClass = c.score > 0 ? 'positive' : c.score < 0 ? 'negative' : '';
            return `
            <div class="comment-item">
                <img class="comment-avatar" src="${avatar}" alt="${nomeUser}" onerror="this.src='${defaultAvatar}'" referrerpolicy="no-referrer">
                <div class="comment-body">
                    <div class="comment-autor">
                        ${nomeUser}
                        <span class="comment-data">${formatarData(c.criado_em)}</span>
                    </div>
                    <div class="comment-texto">${escapeHtml(c.texto)}</div>
                    <div class="comment-footer-votes">
                        <div class="vote-group small">
                            <button class="vote-btn upvote ${meuVoto === 1 ? 'active' : ''}"
                                onclick="votarComentario('${c.id}', 1, event)" title="Gosto">▲</button>
                            <span class="vote-score ${scoreClass} score-comm-val-${c.id}" id="score-comment-${c.id}">${c.score || 0}</span>
                            <button class="vote-btn downvote ${meuVoto === -1 ? 'active' : ''}"
                                onclick="votarComentario('${c.id}', -1, event)" title="Não gosto">▼</button>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');

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
        el.className   = `vote-score ${novoScore > 0 ? 'positive' : novoScore < 0 ? 'negative' : ''} score-comm-val-${commentId}`;
        
        // Encontrar o vote-group específico deste comentário para evitar conflitos
        const group = el.closest('.vote-group.small');
        if (group) {
            group.querySelector('.vote-btn.upvote')?.classList.toggle('active', meuVoto === 1);
            group.querySelector('.vote-btn.downvote')?.classList.toggle('active', meuVoto === -1);
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
        carregarFeed(true);

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
    if (ordem !== 'score_desc' && ordem !== 'score_asc') return;
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

window.feedComunidadeRecarregar = () => carregarFeed(true);
