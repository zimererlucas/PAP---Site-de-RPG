# 📅 Cronograma de Desenvolvimento - Projeto Gênesis (RPG)

Este documento detalha o planeamento do projeto (de setembro até 22 de maio), distribuído de forma justa e equilibrada para uma equipa de duas pessoas. Ninguém fica sobrecarregado ou sem trabalho em nenhum momento.

**Equipa:**
*   **Membro A (Foco Backend/Lógica):** Banco de dados (Supabase), SQL, autenticação, lógica pesada em JavaScript (turnos, cálculos).
*   **Membro B (Foco Frontend/UI):** HTML/CSS (UI/UX responsiva), integrações DOM, design de componentes, interações visuais.

---

## 📊 Gráfico Gantt (Visão Geral)

```mermaid
gantt
    title Cronograma Projeto Gênesis (Setembro a 22 de Maio)
    dateFormat YYYY-MM-DD
    axisFormat %b

    section Fase 1: Planeamento (Set)
    Pesquisar mecânicas de RPG e definir regras        :a1, 2025-09-01, 15d
    Projetar wireframes e fluxos (Membro B)            :a2, 2025-09-16, 15d
    Modelar diagrama ER e banco de dados (Membro A)    :a3, 2025-09-16, 15d

    section Fase 2: Base (Out)
    Configurar Supabase e Auth (Membro A)              :b1, 2025-10-01, 15d
    Codificar estrutura HTML/CSS (Membro B)            :b2, 2025-10-01, 15d
    Criar tabelas SQL iniciais (Membro A)              :b3, 2025-10-16, 16d
    Implementar UI de Login e Registo (Membro B)       :b4, 2025-10-16, 16d

    section Fase 3: Fichas (Nov)
    Desenvolver lógica JS de atributos (Membro A)      :c1, 2025-11-01, 15d
    Codificar layout HTML da ficha (Membro B)          :c2, 2025-11-01, 15d
    Implementar CRUD de inventário (Membro A)          :c3, 2025-11-16, 15d
    Criar modais de itens e status (Membro B)          :c4, 2025-11-16, 15d

    section Fase 4: Campanhas (Dez-Jan)
    Desenvolver funções p/ criar campanhas (Membro A)  :d1, 2025-12-01, 20d
    Codificar layout do painel do mestre (Membro B)    :d2, 2025-12-01, 20d
    Realizar revisão técnica do código (Ambos)         :d3, 2025-12-21, 14d
    Implementar lógica de combate/turnos (Membro A)    :d4, 2026-01-04, 27d
    Construir painel visual de combate (Membro B)      :d5, 2026-01-04, 27d

    section Fase 5: Comunidade (Fev)
    Desenvolver APIs para posts e feed (Membro A)      :e1, 2026-02-01, 14d
    Codificar interface da comunidade (Membro B)       :e2, 2026-02-01, 14d
    Implementar mecânica de Upvote (Membro A)          :e3, 2026-02-15, 13d
    Aplicar microinterações de votos (Membro B)        :e4, 2026-02-15, 13d

    section Fase 6: Sistema & Admin (Mar)
    Implementar queries da enciclopédia (Membro A)     :f1, 2026-03-01, 15d
    Codificar layout do guia de regras (Membro B)      :f2, 2026-03-01, 15d
    Configurar políticas RLS para admin (Membro A)     :f3, 2026-03-16, 16d
    Construir interface de edição de regras (Membro B) :f4, 2026-03-16, 16d

    section Fase 7: Ajustes (Abr)
    Depurar lógica pesada e Supabase (Membro A)        :g1, 2026-04-01, 15d
    Corrigir quebras de layout na UI (Membro B)        :g2, 2026-04-01, 15d
    Otimizar performance de consultas SQL (Membro A)   :g3, 2026-04-16, 15d
    Testar responsividade no mobile (Membro B)         :g4, 2026-04-16, 15d

    section Fase 8: Entrega (Mai)
    Executar testes E2E das jornadas (Ambos)           :h1, 2026-05-01, 10d
    Redigir documentação final (Ambos)                 :h2, 2026-05-11, 10d
    Compilar apresentação do projeto (Ambos)           :milestone, 2026-05-22, 0d
```

---

## 📋 Divisão Detalhada de Tarefas (Equilibrada e Acionável)

### 📌 1. Setembro: Planeamento e Arquitetura
*   **Ambos:** **Pesquisar mecânicas de RPG e definir regras base** para sistema de combate, cálculos de atributos e magias.
*   **Membro A:** **Modelar o diagrama ER e arquitetura do banco de dados**, definindo chaves estrangeiras e relações do Supabase.
*   **Membro B:** **Projetar wireframes e fluxos de navegação (Figma)** de todas as telas principais (Fichas, Combate, Comunidade).

### 📌 2. Outubro: Base do Projeto
*   **Membro A:** **Configurar Supabase e implementar sistema de autenticação** utilizando a API de Auth (Login e Registo).
*   **Membro B:** **Codificar estrutura base HTML/CSS e variáveis globais**, estabelecendo o design system (cores, tipografia).
*   **Membro A:** **Criar tabelas SQL iniciais para utilizadores e perfis** no Supabase.
*   **Membro B:** **Implementar a interface (UI) das telas de Login e Registo** com validação de formulários frontend.

### 📌 3. Novembro: Fichas de Personagem
*   **Membro A:** **Desenvolver lógica JS para cálculo de atributos na ficha** (Vida, Mana, Iniciativa, Bónus de força/agilidade).
*   **Membro B:** **Codificar o layout HTML/CSS da ficha de personagem**, estilizando inputs, labels e barras de progresso.
*   **Membro A:** **Implementar CRUD e gestão de inventário no backend**, salvando itens e armas na base de dados (Supabase JSON/Tabelas).
*   **Membro B:** **Criar modais de interface para adicionar itens e técnicas** (Magias/Habilidades), com janelas sobrepostas e botões de fechar.

### 📌 4. Dezembro: Início das Campanhas
*   **Membro A:** **Desenvolver funções SQL e JS para criação de campanhas**, incluindo vincular utilizadores a uma campanha específica.
*   **Membro B:** **Codificar layout do painel do mestre e lista de campanhas** no frontend, criando os cartões que listam campanhas ativas.
*   **Ambos:** **Realizar revisão técnica do código (Pausa de Férias)** e reavaliar o cronograma.

### 📌 5. Janeiro: Sistema de Combate e Turnos (Foco Máximo)
*   **Membro A:** **Implementar lógica de combate e gestão de turnos em tempo real**, utilizando *realtime subscriptions* do Supabase para refletir o turno atual.
*   **Membro B:** **Construir painel visual de combate com animações de dados**, desenvolvendo a área onde os ícones de personagem aparecem na linha do tempo.

### 📌 6. Fevereiro: Comunidade
*   **Membro A:** **Desenvolver APIs e SQL para criação de posts e feed**, recuperando os posts mais recentes da comunidade com paginação.
*   **Membro B:** **Codificar interface da comunidade e sistema de comentários** criando uma UI no formato *feed*, com campos de input intuitivos.
*   **Membro A:** **Implementar mecânica de Upvote/Downvote e algoritmos de filtro** (Ex: Mais Votados, Recentes) utilizando SQL complexo.
*   **Membro B:** **Aplicar feedback visual e microinterações no sistema de votos**, alterando a cor e estado dos botões ao serem clicados.

### 📌 7. Março: Painel Admin & Enciclopédia (Sistema)
*   **Membro A:** **Implementar querys SQL para extrair capítulos da enciclopédia** a partir da tabela `capitulos_sistema`.
*   **Membro B:** **Codificar layout responsivo do guia de regras do sistema** no frontend, organizando em menus laterais tipo Wiki.
*   **Membro A:** **Configurar políticas RLS e proteção de rotas para admin**, impedindo utilizadores normais de apagarem publicações de outros.
*   **Membro B:** **Construir interface de edição de regras no painel admin**, substituindo popups padrão do navegador por modais customizados.

### 📌 8. Abril: Fase de Polimento (Bugfixing)
*   **Membro A:** **Depurar lógica pesada e corrigir bugs no backend/Supabase** (Ex: falhas no realtime do combate, cálculo de HP).
*   **Membro B:** **Corrigir quebras de layout e alinhar elementos visuais** inconsistentes em diferentes navegadores.
*   **Membro A:** **Otimizar performance de consultas e rever segurança SQL**, garantindo que não haja acessos indevidos aos dados.
*   **Membro B:** **Testar responsividade e corrigir bugs no mobile**, garantindo que as fichas e o combate são usáveis num telemóvel.

### 📌 9. Maio (1 a 22): Testes, Relatório e Entrega
*   **Ambos:** **Executar testes E2E cobrindo todas as jornadas do utilizador**, como se fossem mestre e jogador a usar a plataforma.
*   **Ambos:** **Redigir capítulos técnicos e elaborar manuais do relatório** para a documentação escrita exigida na PAP.
*   **Ambos:** **Compilar versão final e preparar a apresentação do projeto**, ensaiando o discurso até o dia 22 de maio.
