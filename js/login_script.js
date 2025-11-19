// ===============================================
// 1. ELEMENTOS DO DOM
// ===============================================
const registerButton = document.getElementById('register');
const loginButton = document.getElementById('login');
const container = document.getElementById('container');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageBox = document.getElementById('messageBox'); // Novo elemento para mensagens

// ===============================================
// 2. FUNÇÃO DE FEEDBACK DE MENSAGEM
// ===============================================

/**
 * Exibe uma mensagem de sucesso ou erro no topo da tela.
 * @param {string} type 'success' ou 'error'
 * @param {string} text O texto da mensagem a ser exibida.
 */
function displayMessage(type, text) {
    if (!messageBox) {
        console.error(`Elemento messageBox não encontrado. Mensagem: [${type}] ${text}`);
        return;
    }

    // Cria o elemento de mensagem
    const msgElement = document.createElement('div');
    msgElement.textContent = text;
    msgElement.className = `message-popup ${type}`;

    // Adiciona a mensagem ao container
    messageBox.innerHTML = ''; // Limpa mensagens antigas
    messageBox.appendChild(msgElement);

    // Mostra a mensagem
    messageBox.classList.add('visible');

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        messageBox.classList.remove('visible');
        setTimeout(() => msgElement.remove(), 500); // Remove o elemento após a transição
    }, 5000);
}


// ===============================================
// 3. LISTENERS DE ANIMAÇÃO (FLIP)
// ===============================================

registerButton.onclick = function(){
    container.className = 'active';
}

loginButton.onclick = function(){
    container.className = 'close';
}


// ===============================================
// 4. HANDLER DO FORMULÁRIO DE LOGIN
// ===============================================
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validação básica
    if (!email || !password) {
        displayMessage('error', '❌ Por favor, preencha todos os campos!');
        return;
    }
    
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';
    
    try {
        // Salvar email se "Remember me" estiver marcado (usando localStorage)
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        // Chamar função de login do auth.js
        const result = await loginWithEmail(email, password);
        
        if (result.success) {
            displayMessage('success', '✅ Login realizado com sucesso! Redirecionando...');
            // Redirecionar para a página inicial
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000); 
        } else {
            displayMessage('error', '❌ Erro ao fazer login: ' + result.error);
            submitButton.disabled = false;
            submitButton.textContent = 'Log In';
        }
    } catch (error) {
        console.error('Erro no login:', error);
        displayMessage('error', '❌ Erro ao fazer login. Tente novamente.');
        submitButton.disabled = false;
        submitButton.textContent = 'Log In';
    }
});


// ===============================================
// 5. HANDLER DO FORMULÁRIO DE REGISTRO
// ===============================================
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Validação básica
    if (!username || !email || !password) {
        displayMessage('error', '❌ Por favor, preencha todos os campos!');
        return;
    }
    
    if (password.length < 6) {
        displayMessage('error', '❌ A senha deve ter no mínimo 6 caracteres!');
        return;
    }
    
    const submitButton = registerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando...';
    
    try {
        // Chamar função de registro do auth.js
        const result = await registerUser(email, password, username);
        
        if (result.success) {
            displayMessage('success', '✅ ' + (result.message || 'Conta criada com sucesso!'));
            // Limpar formulário
            registerForm.reset();
            // Voltar para tela de login
            container.className = 'close';
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        } else {
            displayMessage('error', '❌ Erro ao criar conta: ' + result.error);
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        displayMessage('error', '❌ Erro ao criar conta. Tente novamente.');
        submitButton.disabled = false;
        submitButton.textContent = 'Register';
    }
});


// ===============================================
// 6. HANDLERS PARA LOGIN SOCIAL
// ===============================================

// Login com Google (Entrar)
document.getElementById('googleLoginBtn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    displayMessage('success', '🔄 Redirecionando para login com Google...');
    
    try {
        await loginWithGoogle();
        // O Supabase irá redirecionar, então não fazemos mais nada aqui.
    } catch (error) {
        console.error('Erro no login com Google:', error);
        displayMessage('error', '❌ Erro ao iniciar login com Google.');
    }
});

// Registro com Google (Inscrever-se)
document.getElementById('googleRegisterBtn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    displayMessage('success', '🔄 Redirecionando para registro com Google...');
    
    try {
        await loginWithGoogle();
        // O Supabase irá redirecionar, o processo de criação de perfil é tratado pelo webhook/db triggers
    } catch (error) {
        console.error('Erro no registro com Google:', error);
        displayMessage('error', '❌ Erro ao iniciar registro com Google.');
    }
});

// Outros logins sociais (Manter como placeholder)
document.getElementById('discordLoginBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    displayMessage('error', '🔜 Login com Discord em breve!');
});

document.getElementById('discordRegisterBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    displayMessage('error', '🔜 Registro com Discord em breve!');
});


// ===============================================
// 7. FECHAR E VERIFICAÇÃO DE ESTADO
// ===============================================

// Botão de fechar - voltar para index
document.getElementById('closeLoginBtn')?.addEventListener('click', function() {
    window.location.href = '../index.html';
});

// Verificar se usuário já está logado ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    const user = await getCurrentUser();
    
    if (user) {
        // Se já estiver logado, redirecionar para index
        window.location.href = '../index.html';
        return;
    }
    
    // Carregar email salvo se existir
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('loginEmail').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
});