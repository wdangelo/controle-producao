# 🏭 Controle de Produção

Sistema web profissional completo para controle de produção de máquinas de fundição, com sincronização em tempo real, persistência de sessão e acompanhamento de produção por operador.

## ✨ Features Principais

- ✅ **Autenticação Segura:** JWT com HttpOnly cookies
- ✅ **Dashboard Administrativo:** CRUD para Usuários, Operadores, Serviços e Peças
- ✅ **Sincronização em Tempo Real:** Polling a cada 1 segundo para produção multi-operador
- ✅ **Persistência de Sessão:** Operador pode pausar e retomar trabalho
- ✅ **Relatórios em Tempo Real:** Acompanhamento de produção por operador
- ✅ **Interface Tablet:** Área do operador otimizada para dispositivos móveis
- ✅ **Containerização:** Docker + Docker Compose

## 🧩 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14 App Router, TypeScript, TailwindCSS |
| **Backend** | Next.js API Routes |
| **Banco de Dados** | PostgreSQL + Prisma ORM |
| **Autenticação** | JWT + HttpOnly Cookies + bcrypt |
| **Validação** | Zod |
| **Containerização** | Docker (node:20-alpine, postgres:15-alpine) |

## 📋 Pré-requisitos

- Node.js 18+ ou 20+
- Docker + Docker Compose (opcional, para deployment)
- PostgreSQL 15+ (local ou via Docker)

## 📦 Setup Local (Windows PowerShell)

### 1. Clonar repositório

```powershell
git clone <seu-repo>
cd controle-producao
```

### 2. Instalar dependências

```powershell
npm install --legacy-peer-deps
```

### 3. Configurar variáveis de ambiente

Crie arquivo `.env.local`:

```env
# Banco de Dados
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/controle_producao"

# Autenticação
JWT_SECRET="seu-jwt-secret-super-seguro-aqui"
```

**Desenvolvimento com Docker:**
```powershell
docker-compose up -d
```

### 4. Setup do Prisma

```powershell
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed  # Popula dados de teste
```

### 5. Iniciar servidor

```powershell
npm run dev
```

Acesse: **http://localhost:3000** (ou 3001 se porta 3000 estiver em uso)

### Credenciais de Teste

**Admin:**
- Email: `admin@example.com`
- Senha: `admin123`

**Operador 1:**
- Email: `operador1@example.com`
- Senha: `op123`

**Operador 2:**
- Email: `operador2@example.com`
- Senha: `op123`

## 🏗️ Arquitetura do Sistema

### Estrutura de Pastas

```
controle-producao/
├── app/
│   ├── api/
│   │   ├── auth/              # Autenticação (login/logout)
│   │   ├── users/             # CRUD de usuários
│   │   ├── operators/         # CRUD de operadores
│   │   ├── services/          # CRUD de serviços
│   │   ├── production/
│   │   │   ├── sessions/      # Gerenciar sessões de operadores
│   │   │   ├── counts/        # Registrar contagem de peças
│   │   │   └── totals/        # Agregação em tempo real
│   │   └── metrics/           # Métricas e relatórios
│   ├── dashboard/             # Painel administrativo
│   │   ├── users/
│   │   ├── operators/
│   │   ├── services/
│   │   ├── metrics/           # Acompanhamento
│   │   └── page.tsx           # Home do dashboard
│   ├── login/                 # Página de login
│   ├── operador/              # Área do operador
│   │   ├── [operatorId]/page.tsx        # Seleção de serviço
│   │   └── [operatorId]/[serviceId]/    # Produção em tempo real
│   └── layout.tsx
├── components/                # Componentes reutilizáveis
├── lib/
│   ├── auth.ts               # Funções JWT
│   ├── prisma.ts             # Client Prisma
│   └── validations.ts        # Esquemas Zod
├── prisma/
│   ├── schema.prisma         # Modelo de dados
│   ├── seed.ts               # Dados iniciais
│   └── migrations/
├── middleware.ts             # Proteção de rotas
├── docker-compose.yml
├── Dockerfile
└── README.md
```

### Modelo de Dados

```
User
├── id, email, senha (bcrypt)
└── createdAt

Operator
├── id, nome, email, status (ativo/inativo)
├── OperationSession[]
└── ProductionCount[]

Service
├── id, cliente, descricao_servico
├── Piece[]
├── OperationSession[]
└── observacoes, data_previsao_entrega

Piece
├── id, nome, serviceId
├── quantidade_prevista
├── tipo_metal, marca_material
├── ProductionCount[]
└── createdAt

OperationSession
├── id, operatorId, serviceId
├── data_inicio, data_fim
├── data_inicio_almoco, data_fim_almoco
└── paused

ProductionCount
├── id, pieceId, operatorId
├── quantity (quantidade produzida)
└── createdAt

AuditLog
├── id, actorUserId, action, tableChanged
└── oldValue, newValue, createdAt
```

## 🔑 Fluxos Principais

### 1️⃣ Login e Acesso ao Dashboard

```
Login (/) 
  ↓
POST /api/auth/login (JWT + HttpOnly Cookie)
  ↓
/dashboard (Middleware valida cookie)
  ↓
Dashboard Admin
```

### 2️⃣ Operador Iniciando Produção

```
/operador/[operatorId]
  ↓ (seleciona serviço)
/operador/[operatorId]/[serviceId]
  ↓
POST /api/production/sessions (start)
  ↓
Página de produção iniciada
```

### 3️⃣ Registrando Produção (Multi-Operador)

```
Operador 1 clica "+ 1"
  ↓
POST /api/production/counts (cria ProductionCount)
  ↓
Frontend polling GET /api/production/totals (a cada 1s)
  ↓
Operador 2 vê atualização em tempo real
```

### 4️⃣ Acompanhamento de Produção

```
Admin acessa /dashboard/metrics
  ↓
Fetch GET /api/production/totals?serviceId=X
  ↓
Agregação por operador
  ↓
Exibe cards KPI + tabela de produção
```

## 📊 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login e obter JWT
- `POST /api/auth/logout` - Logout

### Usuários (CRUD)
- `GET /api/users` - Listar todos
- `POST /api/users` - Criar novo
- `PUT /api/users/[id]` - Atualizar
- `DELETE /api/users/[id]` - Remover

### Operadores (CRUD)
- `GET /api/operators` - Listar todos
- `POST /api/operators` - Criar novo
- `PUT /api/operators/[id]` - Atualizar
- `DELETE /api/operators/[id]` - Remover

### Serviços (CRUD + Peças)
- `GET /api/services` - Listar com peças
- `POST /api/services` - Criar novo com peças
- `PUT /api/services/[id]` - Atualizar
- `DELETE /api/services/[id]` - Remover

### Produção (Real-Time)
- `POST /api/production/sessions` - Iniciar/pausar/resumir/finalizar sessão
- `GET /api/production/sessions` - Recuperar sessão anterior
- `POST /api/production/counts` - Registrar peça produzida
- `GET /api/production/totals` - Agregação em tempo real
- `GET /api/production/counts` - Histórico de contagens

### Métricas
- `GET /api/metrics?period=day|week|month` - Ranking de produção

## 🎮 Uso do Sistema

### Admin

1. **Acessar Dashboard:** `/dashboard`
2. **Criar Operadores:** `/dashboard/operators` → "Novo Operador"
3. **Criar Serviços:** `/dashboard/services` → "Novo Serviço" + Adicionar Peças
4. **Visualizar Produção:** `/dashboard/metrics`
5. **Gerenciar Dados:** Usuários, Operadores, Serviços

### Operador

1. **Login:** `/` com credenciais
2. **Selecionar Serviço:** `/operador/[id]` → Clique no serviço
3. **Registrar Produção:** `/operador/[id]/[serviceId]`
   - Iniciar sessão: "Iniciar Produção"
   - Adicionar peça: "+ 1" ou "+ 5"
   - Pausar: "Pausar"
   - Finalizar: "Finalizar Sessão"
4. **Visualizar Sincronização:** Totais atualizam a cada 1 segundo

## 🐳 Deployment com Docker

### Build

```powershell
docker-compose build
```

### Executar

```powershell
docker-compose up -d
```

Serviço rodará em `http://localhost:3000`

### Logs

```powershell
docker-compose logs -f app
docker-compose logs -f db
```

### Parar

```powershell
docker-compose down
```

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ JWT assinado com secret seguro
- ✅ HttpOnly cookies (CSRF protegido)
- ✅ Middleware valida autenticação
- ✅ SQL Injection prevenida (Prisma)
- ✅ XSS prevenido (React/Next.js)

## 📱 Responsividade

- **Desktop:** Layout completo com sidebar
- **Tablet:** Interface otimizada (Android/iPad)
- **Mobile:** Reduz coluna de sidebar

## 🚀 Performance

- **Polling:** 1 segundo para sincronização
- **Caching:** Dados de serviços em cache do cliente
- **Lazy Loading:** Componentes com `dynamic` para reduzir bundle
- **Database:** Índices em campos de filtro (serviceId, operatorId)

## 🧪 Testing

```powershell
# Teste multi-operador
# 1. Login com operador1
# 2. Iniciar produção em serviço
# 3. Em outra aba, login com operador2
# 4. Acessar mesmo serviço
# 5. Operador1 deve ver totais de operador2 em tempo real
```

## 📝 Logs e Auditoria

Todas as ações são registradas em `AuditLog`:
- Quem executou (actorUserId)
- Qual ação (insert, update, delete)
- Qual tabela foi modificada
- Valores antigos e novos

Acesse via API: `GET /api/audit` (implementar conforme necessário)

## 🐛 Troubleshooting

### Porta 3000 em uso
```powershell
# Next.js tentará porta 3001
npm run dev
# Ou liberar porta 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro de conexão PostgreSQL
```powershell
# Verificar se banco está rodando
docker-compose ps

# Reiniciar
docker-compose restart db
```

### Cookies não persistindo
- Certifique-se que `secure: false` em dev
- Middleware deve estar protegendo rotas
- Verificar cabeçalho `Set-Cookie`

## 📚 Documentação Adicional

- `ARCHITECTURE.md` - Arquitetura detalhada
- `DOCKER.md` - Setup Docker
- `GETTING_STARTED.md` - Guia inicial
  - **Usuários:** `/dashboard/users` (CRUD)
  - **Operadores:** `/dashboard/operators` (CRUD com código 4 dígitos)
  - **Serviços:** `/dashboard/services` (CRUD com peças dinâmicas)
  - **Acompanhamento:** `/dashboard/metrics` (ranking, filtros dia/semana/mês)

### Módulo 2 – Área do Operador (tablet, sem login)

- **Fluxo:**
  1. `/operador` → Selecionar operador
  2. `/operador/[operatorId]` → Selecionar serviço
  3. `/operador/[operatorId]/[serviceId]` → Produção (iniciar/pausar/retomar/finalizar, incrementar peças)

## 🗂️ Estrutura de Pastas

```
controle-producao/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── operators/page.tsx
│   │   ├── services/page.tsx
│   │   └── metrics/page.tsx
│   ├── operador/
│   │   ├── page.tsx
│   │   └── [operatorId]/
│   │       ├── page.tsx
│   │       └── [serviceId]/page.tsx
│   └── api/
│       ├── auth/login/route.ts
│       ├── users/route.ts
│       ├── users/[id]/route.ts
│       ├── operators/route.ts
│       ├── operators/[id]/route.ts
│       ├── services/route.ts
│       ├── services/[id]/route.ts
│       ├── production/sessions/route.ts
│       ├── production/counts/route.ts
│       └── metrics/route.ts
├── components/ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts (bcrypt, JWT)
│   ├── audit.ts
│   └── validations.ts (Zod)
├── prisma/
│   └── schema.prisma
├── middleware.ts (protege /dashboard)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 📊 Modelos Prisma

- **User:** admins (nome, email, senha hash)
- **Operator:** operadores (nome, código 4 dígitos)
- **Service:** serviços/projetos (cliente, descrição, tipo metal, data previsão, peças)
- **Piece:** peças de cada serviço (nome, quantidade prevista)
- **OperationSession:** sessões de trabalho (início, pausa almoço, retorno, fim)
- **ProductionCount:** registro de peças produzidas (pieceId, operatorId, quantity)
- **AuditLog:** auditoria (ação, entidade, antes/depois)

## 🚀 Deploy (Vercel + Neon)

1. **Banco:** Crie um DB PostgreSQL no [Neon](https://neon.tech)
2. **Vercel:** 
   - Conecte seu repo GitHub
   - Adicione variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`
   - Build command: `npm run build`
   - Deploy!

3. **Rodar migrations no production:**
```powershell
npx prisma migrate deploy
```

## 🔐 Segurança

- Senhas armazenadas com bcrypt
- JWT em HttpOnly cookies
- Middleware protege rotas `/dashboard`
- Auditoria de ações críticas

## 📱 Responsividade

- Layout mobile-first
- Sidebar colapsável no tablet
- Grid adaptável para celular/tablet/desktop

## 🛠️ Scripts NPM

```powershell
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Lint
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:migrate   # Rodar migrations
npm run prisma:studio    # Abrir Prisma Studio
```

## 💡 Melhorias Futuras

- Gráficos de produção (Chart.js / Recharts)
- Notificações em tempo real (WebSockets)
- Export de relatórios (PDF/Excel)
- Autenticação OAuth (Google, Microsoft)
- Multi-tenancy (várias empresas)
- PWA para tablet offline
- Testes unitários (Jest, Vitest)
- E2E (Playwright, Cypress)

---

**Desenvolvido como sistema fullstack profissional com Next.js 14, Prisma e PostgreSQL.**
