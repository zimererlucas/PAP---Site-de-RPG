// ================================================================
// CRIAR-TOPICO.JS — Sistema de Criação de Tópico do Fórum
// ================================================================

let currentUser = null;
let isEditingPost = false;
let postEmEdicaoId = null;
let easyMDE = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check user login
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
    } catch { }

    if (!currentUser) {
        window.location.href = 'comunidade.html';
        return;
    }

    // 2. Initialize EasyMDE
    easyMDE = new EasyMDE({
        element: document.getElementById('postConteudo'),
        spellChecker: false,
        sideBySideFullscreen: false,
        placeholder: "Escreve aqui a tua ideia… Podes usar Markdown para formatação, adicionar imagens, links, etc.",
        toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "side-by-side", "fullscreen", "guide"],
        uploadImage: true,
        imageAccept: 'image/png, image/jpeg, image/gif, image/webp',
        imageMaxSize: 1024 * 1024 * 5, // 5MB
        imageUploadFunction: async function(file, onSuccess, onError) {
            try {
                const fileName = `forum/${currentUser.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\\-]/g, '')}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                onSuccess(publicUrlData.publicUrl);
            } catch (err) {
                console.error("Erro no upload da imagem:", err);
                onError("Erro ao carregar a imagem. Certifica-te de que tem menos de 5MB.");
            }
        }
    });

    // Ativar o modo side-by-side automaticamente
    setTimeout(() => {
        if (!easyMDE.isSideBySideActive()) {
            easyMDE.toggleSideBySide();
        }
        
        // ── Observar mudanças na preview para adicionar wrappers de redimensionamento às imagens ──
        const previewEl = document.querySelector('.editor-preview');
        if (previewEl) {
            const observer = new MutationObserver(() => {
                const images = previewEl.querySelectorAll('img:not(.handled-by-resizer)');
                images.forEach(img => {
                    if (img.closest('.custom-resizable-wrapper')) return;
                    img.classList.add('handled-by-resizer');
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'custom-resizable-wrapper';
                    img.parentNode.insertBefore(wrapper, img);
                    wrapper.appendChild(img);

                    const handle = document.createElement('div');
                    handle.className = 'custom-resize-handle';
                    wrapper.appendChild(handle);

                    handle.addEventListener('mousedown', (e) => {
                        let startX = e.clientX;
                        let startWidth = wrapper.offsetWidth || img.clientWidth;
                        e.preventDefault();

                        const onMouseMove = (ev) => {
                            const newWidth = Math.max(50, startWidth + (ev.clientX - startX));
                            wrapper.style.width = newWidth + 'px';
                        };

                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);

                            // Gravar o novo tamanho no texto do editor
                            const src = img.getAttribute('src');
                            if (!src) return;
                            const alt = img.getAttribute('alt') || '';
                            const finalWidth = wrapper.offsetWidth;

                            let text = easyMDE.value();
                            const safeSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            
                            // Regex para Markdown e HTML
                            const mdRegex = new RegExp(`!\\[.*?\\]\\(${safeSrc}\\)`, 'g');
                            const htmlRegex = new RegExp(`<img[^>]+src=["']${safeSrc}["'][^>]*>`, 'g');

                            let replaced = false;
                            let newText = text.replace(mdRegex, (match) => {
                                replaced = true;
                                return `<img src="${src}" alt="${alt}" width="${finalWidth}">`;
                            });

                            if (!replaced) {
                                newText = text.replace(htmlRegex, (match) => {
                                    if (match.includes('width=')) {
                                        return match.replace(/width=["']?\\d+["']?/, `width="${finalWidth}"`);
                                    } else {
                                        return match.replace('<img ', `<img width="${finalWidth}" `);
                                    }
                                });
                            }

                            if (newText !== text) {
                                const cursor = easyMDE.codemirror.getCursor();
                                easyMDE.value(newText);
                                easyMDE.codemirror.setCursor(cursor);
                            }
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });
                });
            });
            observer.observe(previewEl, { childList: true, subtree: true });
        }
    }, 100);

    // 3. Setup form
    document.querySelectorAll('input[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', onTipoChange);
    });
    
    // Check url params for editing
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
        isEditingPost = true;
        postEmEdicaoId = editId;
        document.getElementById('pageTitle').textContent = '✏️ Editar Tópico';
        document.getElementById('btnSubmitPost').textContent = 'Guardar Alterações';
        carregarDadosEdicao(editId);
    }

    await carregarFichasECampanhasDoUser();
});

function onTipoChange() {
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    const refF = document.getElementById('refPersonagemSection');
    const refC = document.getElementById('refCampanhaSection');

    refF.style.display = 'none';
    refC.style.display = 'none';

    if (tipo === 'personagem') refF.style.display = 'block';
    if (tipo === 'mundo' || tipo === 'narrativa') refC.style.display = 'block';
}

async function carregarFichasECampanhasDoUser() {
    try {
        // Fichas (personagens usa perfil_id)
        const { data: fichas } = await supabase
            .from('personagens')
            .select('id, nome, raca, nivel')
            .eq('perfil_id', currentUser.id)
            .order('nome');

        const sel = document.getElementById('selectPersonagem');
        fichas?.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.nome} (${f.raca || '?'} · Nível ${f.nivel || '?'})`;
            sel.appendChild(opt);
        });

        // Campanhas
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

async function carregarDadosEdicao(postId) {
    try {
        const { data: post, error } = await supabase.from('posts').select('*').eq('id', postId).single();
        if (error) throw error;

        if (post?.user_id !== currentUser?.id) {
            mostrarToast('Não tens permissão para editar este post.', 'error');
            setTimeout(() => window.location.href = 'comunidade.html', 1500);
            return;
        }

        const radio = document.getElementById(`tipo-${post.tipo}`);
        if (radio) {
            radio.checked = true;
            onTipoChange();
        }
        document.getElementById('postTitulo').value = post.titulo;
        
        // Wait for EasyMDE to be ready, then set value
        easyMDE.value(post.conteudo);

        setTimeout(() => {
            if (post.personagem_id) document.getElementById('selectPersonagem').value = post.personagem_id;
            if (post.campanha_id) document.getElementById('selectCampanha').value = post.campanha_id;
        }, 500);

    } catch (err) {
        console.error('Erro ao editar post:', err);
        mostrarToast('Erro ao carregar dados para edição.', 'error');
    }
}

async function submitPost(event) {
    event.preventDefault();

    const btn = document.getElementById('btnSubmitPost');
    btn.disabled = true;
    btn.textContent = 'A publicar…';

    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || 'outro';
    const titulo = document.getElementById('postTitulo').value.trim();
    const conteudo = easyMDE.value().trim();
    const fichaId = document.getElementById('selectPersonagem').value || null;
    const campanhaId = document.getElementById('selectCampanha').value || null;

    if (!titulo || !conteudo) {
        mostrarToast('Preenche o título e o conteúdo.', 'error');
        btn.disabled = false;
        btn.textContent = 'Publicar Tópico';
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
            result = await supabase.from('posts').insert(postData).select();
        }

        if (result.error) throw result.error;

        mostrarToast(isEditingPost ? 'Tópico atualizado! ✅' : 'Tópico publicado com sucesso! 🎉', 'success');
        
        const newlyCreatedPost = isEditingPost ? postEmEdicaoId : result.data[0].id;

        setTimeout(() => {
            window.location.href = `topico.html?id=${newlyCreatedPost}`;
        }, 1500);

    } catch (err) {
        console.error('Erro ao publicar:', err);
        mostrarToast('Erro ao publicar o tópico.', 'error');
        btn.disabled = false;
        btn.textContent = 'Publicar Tópico';
    }
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
