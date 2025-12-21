const SUPABASE_URL = 'https://rdrbhapthqnpdtqubuwo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcmJoYXB0aHFucGR0cXVidXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTE2MDUsImV4cCI6MjA3NTM4NzYwNX0.QjZOhXNBYU_F5HKjVDRfY6aFNsNSDodX3q4YJbBwM8U';

// Inicializa o cliente Supabase (só se ainda não existir)
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// Criar referência global para compatibilidade (sem const/let/var para evitar redeclaração)
window.supabase = window.supabaseClient;
supabase = window.supabaseClient;

// Modal de confirmação customizado (substitui window.confirm)
window.showConfirmDialog = function (message, options = {}) {
    const {
        confirmText = 'Confirmar',
        cancelText = 'Cancelar'
    } = options;

    return new Promise(resolve => {
        // Remover instâncias anteriores
        const existing = document.querySelector('.confirm-overlay');
        if (existing) existing.remove();

        // Travar scroll do body enquanto o modal está aberto
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('confirm-open');

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
			<div class="confirm-message">${message}</div>
			<div class="confirm-actions">
				<button type="button" class="confirm-btn confirm-yes">${confirmText}</button>
				<button type="button" class="confirm-btn confirm-no">${cancelText}</button>
			</div>
		`;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Garantir que o modal esteja visível na viewport com rolagem suave
        requestAnimationFrame(() => {
            const firstButton = dialog.querySelector('.confirm-yes');
            if (firstButton) firstButton.focus();
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });

                const firstButton = dialog.querySelector('.confirm-yes');
                if (firstButton) firstButton.focus();
            });
        });

        const cleanup = (result) => {
            overlay.remove();
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            document.body.classList.remove('confirm-open');
            resolve(result);
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') cleanup(false);
            if (e.key === 'Enter') cleanup(true);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });

        dialog.querySelector('.confirm-yes').addEventListener('click', () => cleanup(true));
        dialog.querySelector('.confirm-no').addEventListener('click', () => cleanup(false));
        document.addEventListener('keydown', onKeyDown);
    });
};

// Bloquear o confirm nativo para evitar que abra a caixa padrão do navegador
window.confirm = function (message) {
    console.warn('confirm() bloqueado. Use showConfirmDialog(). Mensagem:', message);
    return false;
};

// Bloquear alert nativo para evitar qualquer popup padrão
window.alert = function (message) {
    console.warn('alert() bloqueado. Mensagem:', message);
};