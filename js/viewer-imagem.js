/**
 * Sistema Global de Visualização de Imagens para o Gênesis RPG
 */

function ampliarImagem(url) {
    if (!url) return;

    // Criar o overlay se não existir
    let overlay = document.getElementById('image-viewer-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'image-viewer-overlay';
        overlay.className = 'image-viewer-overlay';
        overlay.innerHTML = '<img id="image-viewer-img" src="" alt="Imagem Ampliada">';
        document.body.appendChild(overlay);

        // Fechar ao clicar no fundo
        overlay.onclick = function () {
            this.style.display = 'none';
        };

        // Impedir que clique na imagem feche o modal (opcional, mas aqui queremos que clique em qualquer lugar feche se for zoom-out)
        // Se quiser que clique na imagem NÃO feche, use event.stopPropagation()
    }

    const img = document.getElementById('image-viewer-img');
    img.src = url;
    overlay.style.display = 'flex';
}

// Inicializar ouvintes para imagens com classe zoomable-image
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('zoomable-image')) {
            ampliarImagem(e.target.src);
        }
    });
});
