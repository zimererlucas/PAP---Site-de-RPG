# 🗂️ Projeto Gênesis - Sistema de RPG

Um sistema completo de RPG colaborativo com fichas de personagem, campanhas e comunidades.

## ✨ Funcionalidades

### 🎲 Sistema de RPG
- **Fichas de Personagem**: Criação e gerenciamento de personagens
- **Sistema de Combate**: Turnos, durações e mecânicas de batalha
- **Campanhas**: Organização de aventuras e narrativas
- **Dados**: Sistema de rolagem integrado

### 🌐 Comunidades
- **Posts e Discussões**: Compartilhamento de conteúdo
- **Sistema de Votos**: Avaliação colaborativa
- **Comentários**: Interação na comunidade

## 🚀 Instalação

### Pré-requisitos
- Node.js 16+
- PostgreSQL (via Supabase)
- Conta no Supabase

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd PAP---Site-de-RPG
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite .env com suas credenciais do Supabase
   ```

4. **Execute o banco de dados**
   ```sql
   -- Execute os arquivos SQL na ordem:
   -- 1. SQL_CRIAR_TABELAS.sql
   -- 2. SQL_COMUNIDADE.sql
   -- 3. Outros arquivos SQL conforme necessário
   ```

5. **Inicie o servidor**
   ```bash
   # Servidor principal (porta 3000)
   npm start

   # Ou para desenvolvimento
   npm run dev
   ```

## 📖 Uso

### Acessando o Sistema
- **Site Principal**: `http://localhost:3000`

## 🏗️ Arquitetura

### Tecnologias
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Banco**: PostgreSQL + Supabase
- **Autenticação**: Supabase Auth

### Estrutura de Arquivos
```
├── pages/           # Páginas HTML
├── js/             # JavaScript do frontend
├── css/            # Estilos CSS
├── assets/         # Imagens e recursos
├── server.js       # Servidor principal
└── SQL_*.sql       # Scripts do banco
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no GitHub
- Verifique os logs do servidor para debugging

---

**Projeto Gênesis** - RPG colaborativo para todos! 🎲✨</content>
<parameter name="filePath">c:\Users\mundo\OneDrive\Ambiente de Trabalho\Site PAP\PAP---Site-de-RPG\README.md