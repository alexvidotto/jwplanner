# Especificação Técnica Unificada - JW Assignments Planner

[cite_start]Este documento serve como a fonte única de verdade (Single Source of Truth) para o desenvolvimento da aplicação JW Assignments Planner[cite: 3]. [cite_start]Ele consolida os requisitos funcionais, regras de negócio, modelo de dados e arquitetura técnica[cite: 4].

## 1. Visão Geral do Produto

[cite_start]O JW Assignments Planner é uma Aplicação Web Progressiva (PWA) destinada ao gerenciamento de designações de reuniões semanais[cite: 6]. [cite_start]O sistema foca em eliminar a fricção na confirmação de partes (para os participantes) e automatizar a resolução de conflitos e regras complexas (para o planejador)[cite: 7].

### Stack Tecnológico (Obrigatório)

* [cite_start]**Frontend:** React.js (Vite), TypeScript, Tailwind CSS, Shadcn/UI, React Query[cite: 9].
* [cite_start]**Backend:** Node.js, NestJS (Framework), Prisma ORM[cite: 12].
* [cite_start]**Banco de Dados:** PostgreSQL[cite: 13].
* [cite_start]**Autenticação:** Firebase Auth (Google + Email/Senha) + Estratégia de "Magic Links" (Token Hash) para ações sem login[cite: 14].
* [cite_start]**Infraestrutura:** Google Cloud Run (Backend), Firebase Hosting (Frontend)[cite: 15].

---

## 2. Personas e Jornadas

### 2.1. O Planejador (Admin)
* [cite_start]**Perfil:** Usuário desktop, foca em produtividade em lote[cite: 19].
* [cite_start]**Responsabilidades:** Cria cronogramas bimestrais, gerencia cadastro de participantes e resolve conflitos[cite: 20].
* **Recursos Chave:**
    * [cite_start]Dashboard de Visão Geral (Semanas Pendentes)[cite: 22].
    * [cite_start]Editor de Semana (Drag & Drop ou Slots com Seleção Inteligente)[cite: 23].
    * [cite_start]Botão "Sugerir Participante" (Algoritmo de recomendação)[cite: 24].

### 2.2. O Participante & O Ajudante
* [cite_start]**Perfil:** Usuário mobile, foca em rapidez[cite: 27].
* [cite_start]**Responsabilidades:** Receber notificação e confirmar presença[cite: 28].
* **Recursos Chave:**
    * [cite_start]**Acesso via Magic Link:** Clica num link do WhatsApp (`/confirmar/:hash`) e vê sua designação sem precisar de senha[cite: 30].
    * [cite_start]**Botões Grandes:** `Confirmar` / `Recusar`[cite: 31].
    * [cite_start]Registro de Indisponibilidade (Férias)[cite: 32].

### 2.3. O Presidente da Reunião
* [cite_start]**Perfil:** Usuário híbrido, foca na execução da semana atual[cite: 36].
* [cite_start]**Responsabilidades:** Garantir que todos confirmaram para a reunião da semana[cite: 36].
* **Recursos Chave:**
    * [cite_start]**Checklist da Semana:** Visualiza status (Confirmado/Pendente) de cada parte[cite: 38].
    * [cite_start]**Ação de Cobrança:** Botão WhatsApp que gera mensagem automática com o link de confirmação para quem está pendente[cite: 38].

---

## 3. Regras de Negócio e Estrutura de Reunião

### 3.1. Estrutura da Reunião (Template Padrão)

[cite_start]A reunião é dividida em 3 seções lógicas[cite: 41]:

1.  **Tesouros da Palavra de Deus (Fixo):**
    * [cite_start]Discurso (10 min) - Requer: Ancião (A) ou Servo (S)[cite: 43].
    * [cite_start]Jóias Espirituais (10 min) - Requer: A ou S[cite: 44].
    * [cite_start]Leitura da Bíblia (4 min) - Requer: Publicador Homem (PH) ou Servo (S)[cite: 45].

2.  **Faça Seu Melhor no Ministério (Dinâmico):**
    * [cite_start]O número de partes varia (ex: 3 a 4 partes)[cite: 48].
    * [cite_start]Tipos comuns: Primeira Conversa, Revisita, Estudo Bíblico, Discurso[cite: 49].
    * [cite_start]Participantes: Variam entre PH, PM (Publicadora Mulher), S, A[cite: 51].
    * [cite_start]Regra de Ajudante: Algumas partes exigem ajudante (ex: Conversas)[cite: 52].

3.  **Nossa Vida Cristã (Semi-Dinâmico):**
    * [cite_start]Partes variáveis iniciais (ex: 1 parte de 15min OU 2 partes menores)[cite: 55].
    * Estudo Bíblico de Congregação (Fixo no Final): 30 min. [cite_start]Requer: Dirigente (A) e Leitor (A, S, PH)[cite: 56].
    * [cite_start]Oração Final (Fixo): Requer: PH batizado (A, S, PH)[cite: 57].

### 3.2. Exceções de Calendário
[cite_start]O Planejador deve poder marcar semanas com "Tags Especiais" que alteram a estrutura[cite: 59]:

* **Visita do Viajante:**
    * [cite_start]Remove: Estudo Bíblico de Congregação (Seção 3)[cite: 61].
    * [cite_start]Adiciona: Discurso de Serviço (30 min) na Seção 3[cite: 63].
* **Assembleia / Congresso:**
    * A semana é bloqueada. [cite_start]Nenhuma designação é permitida[cite: 66].

### 3.3. Regras de Validação de Designação
1.  **Gênero (Rigoroso):**
    * [cite_start]Se o titular é PM (Mulher), o ajudante DEVE ser PM[cite: 69].
    * [cite_start]Se o titular é PH (Homem), o ajudante DEVE ser PH (salvo exceções raras de encenação familiar, mas a regra padrão é estrita)[cite: 70].
2.  [cite_start]**Habilidade:** O participante só pode ser selecionado se tiver a Habilidade vinculada à Parte (ex: Nem todo PH pode fazer a "Leitura da Bíblia", apenas os aprovados)[cite: 71].
3.  [cite_start]**Duplicidade:** Um participante não pode ter 2 partes principais na mesma reunião (Warning)[cite: 72].
4.  [cite_start]**Indisponibilidade:** O sistema deve bloquear seleção de participantes em período de férias cadastrado[cite: 73].

---

## 4. Modelo de Dados (Schema Sugerido - Prisma)

[cite_start]Este esquema define as entidades principais para o banco de dados PostgreSQL[cite: 75].

```prisma
[cite_start]// Enums para Tipos Fixos [cite: 76-94]
enum Privilegio {
  ANCIAO      // A
  SERVO       // S
  PUB_HOMEM   // PH
  PUB_MULHER  // PM
}

enum StatusDesignacao {
  PENDENTE    //
  CONFIRMADO  //
  RECUSADO    //
  SUBSTITUIDO //
}

enum TipoSemana {
  NORMAL           //
  VISITA_VIAJANTE  //
  ASSEMBLEIA       //
}

[cite_start]// Modelos [cite: 95-169]
model Participante {
  id           String      @id @default(uuid()) 
  nome         String      
  email        String?     @unique // Opcional, para login
  telefone     String?     // Formato E.164 para links WhatsApp
  privilegio   Privilegio  
  podeDesignar Boolean     @default(true) // Ativo/Inativo
  uidAuth      String?     @unique // ID do Firebase Auth (se tiver login)

  // Relações
  habilidades       Habilidade[]      
  designacoes       Designacao[]      @relation("Titular") 
  ajudas            Designacao[]      @relation("Ajudante") 
  indisponibilidades Indisponibilidade[] 
}

model ParteTemplate {
  id              String      @id @default(uuid()) 
  titulo          String      // Ex: "Leitura da Bíblia" 
  secao           String      // "Tesouros", "FSM", "NVC"
  requerAjudante  Boolean     @default(false) 
  generoExclusivo Privilegio? // Se null, ambos podem. Se setado, restringe.

  // Relações
  habilidades     Habilidade[] // Quem pode fazer essa parte
  designacoes     Designacao[] 
}

model Habilidade {
  id              String        @id @default(uuid()) 
  participanteId  String        
  parteTemplateId String        
  participante    Participante  @relation(fields: [participanteId], references: [id]) 
  parteTemplate   ParteTemplate @relation(fields: [parteTemplateId], references: [id]) 
}

model Semana {
  id          String        @id @default(uuid()) 
  dataInicio  DateTime      // Segunda-feira da semana
  descricao   String        // Ex: "15-21 de Dezembro"
  tipo        TipoSemana    @default(NORMAL) 
  presidenteId String?      // ID do Participante que presidirá
  designacoes Designacao[]  
}

model Designacao {
  id              String            @id @default(uuid()) 
  semanaId        String            
  parteTemplateId String            
  titularId       String?           // Pode começar vazio no planejamento
  ajudanteId      String?           
  tituloDoTema    String?           // Ex: "Foi profetizada uma grande luz"
  tempo           Int?              // Em minutos (para partes dinâmicas)
  status          StatusDesignacao  @default(PENDENTE) 
  tokenConfirmacao String?          @unique // Hash para Magic Link

  semana          Semana            @relation(fields: [semanaId], references: [id]) 
  parteTemplate   ParteTemplate     @relation(fields: [parteTemplateId], references: [id]) 
  titular         Participante?     @relation("Titular", fields: [titularId], references: [id]) 
  ajudante        Participante?     @relation("Ajudante", fields: [ajudanteId], references: [id]) 
}

model Indisponibilidade {
  id             String       @id @default(uuid()) 
  participanteId String       
  dataInicio     DateTime     
  dataFim        DateTime     
  motivo         String?      
  participante   Participante @relation(fields: [participanteId], references: [id]) 
}
```

---

## 5. Requisitos Funcionais Detalhados

### Módulo 1: Autenticação e Acesso
* [cite_start]**RF01 - Login Híbrido:** Suportar login Google e Email/Senha via Firebase[cite: 172].
* [cite_start]**RF02 - Guest Access:** Permitir confirmação de Designação via rota pública `/confirmar/:token` sem exigir sessão autenticada[cite: 173].
* [cite_start]**RF03 - Proteção de Rotas:** Apenas usuários com flag `isAdmin` (definida no backend ou custom claim do Firebase) podem acessar o painel de Planejamento[cite: 175].

### Módulo 2: Gestão de Participantes
* [cite_start]**RF04 - CRUD Participante:** Admin pode criar/editar participantes e atribuir privilégios[cite: 178].
* [cite_start]**RF05 - Matriz de Habilidades:** Interface visual (Checkbox Table) para vincular Participantes a Partes Templates[cite: 179]. [cite_start]Ex: Marcar que "João" pode fazer "Leitura de A Sentinela"[cite: 180].

### Módulo 3: Motor de Planejamento
* [cite_start]**RF06 - Geração de Grade:** Ao criar um mês, o sistema gera as semanas automaticamente baseadas nas datas[cite: 182].
* [cite_start]**RF07 - Drag & Drop / Slot Picker:** Interface onde o Admin clica no slot vazio e vê lista de sugestões[cite: 183].
* [cite_start]**RF08 - Algoritmo de Sugestão:** A lista de sugestão deve[cite: 184]:
    1.  [cite_start]Filtrar quem tem a Habilidade[cite: 185].
    2.  [cite_start]Filtrar quem NÃO está Indisponível (Férias)[cite: 186].
    3.  [cite_start]Ordenar por data da última designação (Mais antigo primeiro)[cite: 187].
* [cite_start]**RF09 - Validação em Tempo Real:** Impedir salvar designação se regra de gênero for violada (ex: PH ajudando PM)[cite: 188].

### Módulo 4: Comunicação
* [cite_start]**RF10 - Geração de Link WhatsApp:** O sistema deve montar a URL `https://wa.me/number?text=...` contendo o Magic Link da designação[cite: 190, 191].
* [cite_start]**RF11 - Notificação de Mudança:** Se um usuário alterar status para RECUSADO, o Admin deve ver um alerta visual no Dashboard[cite: 192].

---

## 6. Diretrizes de Interface (UI/UX)

* **Responsividade:**
    * [cite_start]**Desktop:** Layout em Grade/Tabela para o Planejador ver a semana completa[cite: 196].
    * **Mobile:** Layout em Cards Verticais. [cite_start]Cada designação é um Card[cite: 197].
* **Feedback Visual:**
    * [cite_start]**Cores de Status:** Pendente (Amarelo), Confirmado (Verde), Recusado (Vermelho)[cite: 199].
    * [cite_start]**Ícones:** Usar ícones da biblioteca `lucide-react` para representar as partes (ex: Livro para leitura, Balão de fala para discurso)[cite: 200].
* **Performance:**
    * [cite_start]Usar React Query para cachear os dados da semana e evitar loading spinners excessivos ao trocar de abas[cite: 202].

---

## 7. Padrões de Qualidade e Desenvolvimento

[cite_start]A fim de garantir a manutenibilidade a longo prazo e a robustez do sistema, as seguintes práticas de engenharia são obrigatórias[cite: 204]:

### 7.1. Testes Automatizados (Backend)
* [cite_start]**Framework de Teste:** Utilizar Jest ou Vitest (integrados ao NestJS)[cite: 207].
* [cite_start]**Cobertura de Testes:** Priorizar testes unitários para a camada de Services onde residem as regras de negócio complexas (ex: Algoritmo de Sugestão, Validação de Gênero)[cite: 208].
* [cite_start]**Testes de Integração:** Implementar testes para os Controllers principais (ex: Fluxo de Confirmação de Designação)[cite: 209].

### 7.2. Estratégia de Banco de Dados para Testes (In-Memory)
* [cite_start]**Padrão Repository:** O acesso ao banco de dados deve ser abstraído utilizando o Repository Pattern[cite: 211].
    * [cite_start]**Interface:** `IUsersRepository`[cite: 214].
    * [cite_start]**Implementação Prod:** `PrismaUsersRepository` (Conecta ao PostgreSQL)[cite: 215].
    * [cite_start]**Implementação Teste:** `InMemoryUsersRepository` (Array em memória)[cite: 216].
* [cite_start]**Objetivo:** Permitir que os testes unitários e o desenvolvimento local de funcionalidades rodem desconectados do banco de dados real[cite: 217]. [cite_start]Isso garante execução instantânea dos testes e isolamento total[cite: 218].
* **Proibido em Unit Tests:** Imports diretos do `PrismaService` dentro das classes de negócio. [cite_start]O Prisma deve ser injetado via Inversão de Dependência para permitir o mock[cite: 219, 220].

### 7.3. Linting e Formatação
* [cite_start]**Ferramentas:** ESLint e Prettier configurados no pipeline de CI/CD[cite: 223].
* [cite_start]**Regras:** Seguir as regras padrão do NestJS e React (strict mode ativado)[cite: 224].