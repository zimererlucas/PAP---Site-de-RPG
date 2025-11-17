// Elementos do DOM
const registerButton = document.getElementById('register')
const loginButton = document.getElementById('login')
const container = document.getElementById('container')
const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')

// Animação flip entre login e registro
registerButton.onclick = function(){
	container.className = 'active'
}

loginButton.onclick = function(){
	container.className = 'close'
}

// Handler do formulário de login
loginForm.addEventListener('submit', async function(e) {
	e.preventDefault()
	
	const email = document.getElementById('loginEmail').value
	const password = document.getElementById('loginPassword').value
	const rememberMe = document.getElementById('rememberMe').checked
	
	// Validação básica
	if (!email || !password) {
		alert('❌ Por favor, preencha todos os campos!')
		return
	}
	
	// Desabilitar botão durante o processo
	const submitButton = loginForm.querySelector('button[type="submit"]')
	submitButton.disabled = true
	submitButton.textContent = 'Entrando...'
	
	try {
		// Salvar email se "Remember me" estiver marcado
		if (rememberMe) {
			localStorage.setItem('rememberedEmail', email)
		} else {
			localStorage.removeItem('rememberedEmail')
		}
		
		// Chamar função de login do auth.js
		const result = await loginWithEmail(email, password)
		
		if (result.success) {
			alert('✅ Login realizado com sucesso!')
			// Redirecionar para a página inicial
			window.location.href = '../index.html'
		} else {
			alert('❌ Erro ao fazer login: ' + result.error)
			submitButton.disabled = false
			submitButton.textContent = 'Log In'
		}
	} catch (error) {
		console.error('Erro no login:', error)
		alert('❌ Erro ao fazer login. Tente novamente.')
		submitButton.disabled = false
		submitButton.textContent = 'Log In'
	}
})

// Handler do formulário de registro
registerForm.addEventListener('submit', async function(e) {
	e.preventDefault()
	
	const username = document.getElementById('registerUsername').value
	const email = document.getElementById('registerEmail').value
	const password = document.getElementById('registerPassword').value
	
	// Validação básica
	if (!username || !email || !password) {
		alert('❌ Por favor, preencha todos os campos!')
		return
	}
	
	if (password.length < 6) {
		alert('❌ A senha deve ter no mínimo 6 caracteres!')
		return
	}
	
	// Desabilitar botão durante o processo
	const submitButton = registerForm.querySelector('button[type="submit"]')
	submitButton.disabled = true
	submitButton.textContent = 'Registrando...'
	
	try {
		// Chamar função de registro do auth.js
		const result = await registerUser(email, password, username)
		
		if (result.success) {
			alert('✅ ' + (result.message || 'Conta criada com sucesso!'))
			// Limpar formulário
			registerForm.reset()
			// Voltar para tela de login
			container.className = 'close'
			submitButton.disabled = false
			submitButton.textContent = 'Register'
		} else {
			alert('❌ Erro ao criar conta: ' + result.error)
			submitButton.disabled = false
			submitButton.textContent = 'Register'
		}
	} catch (error) {
		console.error('Erro no registro:', error)
		alert('❌ Erro ao criar conta. Tente novamente.')
		submitButton.disabled = false
		submitButton.textContent = 'Register'
	}
})

// Handlers para botões de login social
document.getElementById('googleLoginBtn').addEventListener('click', async function(e) {
	e.preventDefault()
	
	try {
		const result = await loginWithGoogle()
		
		if (result.success) {
			// O redirecionamento será feito automaticamente pelo OAuth
			alert('✅ Redirecionando para login com Google...')
		} else {
			alert('❌ Erro ao fazer login com Google: ' + result.error)
		}
	} catch (error) {
		console.error('Erro no login com Google:', error)
		alert('❌ Erro ao fazer login com Google. Tente novamente.')
	}
})

document.getElementById('discordLoginBtn').addEventListener('click', function(e) {
	e.preventDefault()
	alert('🔜 Login com Discord em breve!')
	// TODO: Implementar login com Discord quando disponível
})

document.getElementById('googleRegisterBtn').addEventListener('click', async function(e) {
	e.preventDefault()
	
	try {
		const result = await loginWithGoogle()
		
		if (result.success) {
			alert('✅ Redirecionando para registro com Google...')
		} else {
			alert('❌ Erro ao registrar com Google: ' + result.error)
		}
	} catch (error) {
		console.error('Erro no registro com Google:', error)
		alert('❌ Erro ao registrar com Google. Tente novamente.')
	}
})

document.getElementById('discordRegisterBtn').addEventListener('click', function(e) {
	e.preventDefault()
	alert('🔜 Registro com Discord em breve!')
	// TODO: Implementar registro com Discord quando disponível
})

// Botão de fechar - voltar para index
document.getElementById('closeLoginBtn').addEventListener('click', function() {
	window.location.href = '../index.html'
})

// Verificar se usuário já está logado ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
	const user = await getCurrentUser()
	
	if (user) {
		// Se já estiver logado, redirecionar para index
		window.location.href = '../index.html'
	}
	
	// Carregar email salvo se existir
	const rememberedEmail = localStorage.getItem('rememberedEmail')
	if (rememberedEmail) {
		document.getElementById('loginEmail').value = rememberedEmail
		document.getElementById('rememberMe').checked = true
	}
})
