# Arquitetura do Sistema - Controle de Produção

## 📐 Visão Geral da Arquitetura

Sistema fullstack moderno construído com Next.js 14 (App Router), utilizando o framework para servir tanto o frontend quanto o backend através de API Routes. A arquitetura segue padrões RESTful e utiliza Server-Side Rendering (SSR) para páginas dinâmicas.

```
┌─────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                    │
│  ┌─────────────────┐         ┌────────────────────────┐ │
│  │ Dashboard Admin │         │  Área do Operador      │ │
│  │  (protegido)    │         │   (público, tablet)    │ │
│  └─────────────────┘         └────────────────────────┘ │
└───────────────────┬───────────────────┬──────────────────┘
                    │                   │
            ┌───────▼───────────────────▼─────────┐
            │       Next.js 14 (App Router)        │
            │  ┌──────────────┐  ┌──────────────┐ │
            │  │   Frontend   │  │   Backend    │ │
            │  │ React + RSC  │  │  API Routes  │ │
            │  └──────────────┘  └──────┬───────┘ │
            │                            │         │
            │  ┌─────────────────────────▼──────┐ │
            │  │   Middleware (Auth JWT)        │ │
            │  └────────────────────────────────┘ │
            └────────────────┬────────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │   Prisma ORM       │
                   └─────────┬──────────┘
                             │
                   ┌─────────▼──────────┐
                   │  PostgreSQL DB     │
                   └────────────────────┘
```

## 🗄️ Modelo de Dados (Prisma Schema)

### Entidades Principais

1. **User** (Administradores)
   - Gerenciam o sistema via dashboard
   - Autenticação JWT
   - Senhas com bcrypt

2. **Operator** (Operadores de máquinas)
   - Registram produção
   - Código único de 4 dígitos

3. **Service** (Projetos/Serviços)
   - Representa um trabalho de fundição
   - Contém múltiplas peças
   - Status ativo/inativo

4. **Piece** (Peças do serviço)
   - Pertence a um Service
   - Quantidade prevista vs produzida

5. **OperationSession** (Sessões de trabalho)
   - Registra início/pausa/retorno/fim
   - Vincula operador + serviço

6. **ProductionCount** (Contadores de produção)
   - Cada incremento de peça produzida
   - Usado para métricas e ranking

7. **AuditLog** (Auditoria)
   - Registra ações críticas (CREATE/UPDATE/DELETE)
   - Armazena estado antes/depois

### Relacionamentos

```
User ─┐
      ├─ AuditLog (quem fez a ação)
      
Operator ─┬─ OperationSession (sessões de trabalho)
          └─ ProductionCount (peças produzidas)

Service ─┬─ Piece (peças do projeto)
         └─ OperationSession (sessões vinculadas)

Piece ───── ProductionCount (contagem por peça)
```

## 🛣️ Estrutura de Rotas

### Frontend (SSR/Client Components)

#### Públicas
- `/` - Landing page
- `/login` - Login administrativo
- `/operador` - Seleção de operador
- `/operador/[operatorId]` - Seleção de serviço
- `/operador/[operatorId]/[serviceId]` - Tela de produção

#### Protegidas (requer autenticação)
- `/dashboard` - Overview
- `/dashboard/users` - CRUD Usuários
- `/dashboard/operators` - CRUD Operadores
- `/dashboard/services` - CRUD Serviços + Peças
- `/dashboard/metrics` - Acompanhamento e ranking

### Backend (API Routes)

#### Autenticação
- `POST /api/auth/login` - Login (retorna JWT em HttpOnly cookie)
- `GET /api/auth/logout` - Logout (limpa cookie)

#### Usuários (CRUD)
- `GET /api/users` - Listar
- `POST /api/users` - Criar
- `GET /api/users/[id]` - Detalhe
- `PATCH /api/users/[id]` - Atualizar
- `DELETE /api/users/[id]` - Excluir

#### Operadores (CRUD)
- `GET /api/operators` - Listar
- `POST /api/operators` - Criar
- `GET /api/operators/[id]` - Detalhe
- `PATCH /api/operators/[id]` - Atualizar
- `DELETE /api/operators/[id]` - Excluir

#### Serviços (CRUD)
- `GET /api/services` - Listar (inclui peças)
- `POST /api/services` - Criar (com peças inline)
- `GET /api/services/[id]` - Detalhe
- `PATCH /api/services/[id]` - Atualizar
- `DELETE /api/services/[id]` - Excluir (cascade peças)

#### Produção
- `POST /api/production/sessions` - Gerenciar sessão (start/pause/resume/end)
- `POST /api/production/counts` - Incrementar contador de peça

#### Métricas
- `GET /api/metrics?period=day|week|month` - Ranking e totais por operador

## 🔐 Fluxo de Autenticação

```
1. Usuário → POST /api/auth/login { email, password }
2. Backend valida credenciais (bcrypt)
3. Backend gera JWT (jsonwebtoken)
4. Backend retorna cookie HttpOnly "auth"
5. Middleware (middleware.ts) valida JWT em rotas /dashboard/*
6. Se inválido → redirect para /
```

## 🔄 Fluxo de Produção (Operador)

```
1. Operador acessa /operador
2. Seleciona seu nome (sem login)
3. Escolhe um serviço ativo
4. Inicia sessão (POST /api/production/sessions { action: 'start' })
5. Durante operação:
   - Pausa para almoço (action: 'pause')
   - Retorna (action: 'resume')
   - Incrementa peças (POST /api/production/counts { pieceId, operatorId })
6. Finaliza sessão (action: 'end')
```

## 📊 Cálculo de Métricas

### Ranking de Operadores

```sql
SELECT 
  operatorId,
  SUM(quantity) as total
FROM ProductionCount
WHERE createdAt >= (NOW() - INTERVAL '1 DAY') -- ajustável
GROUP BY operatorId
ORDER BY total DESC
```

### Saldo por Peça

```
Saldo = quantidade_prevista - SUM(ProductionCount.quantity WHERE pieceId = X)
```

## 🛡️ Segurança

1. **Senhas**: bcrypt com salt rounds = 10
2. **JWT**: HttpOnly cookies, expira em 12h
3. **Middleware**: protege rotas `/dashboard/*`
4. **Validação**: Zod schemas em todas APIs
5. **Auditoria**: logs de ações críticas com before/after
6. **SQL Injection**: Prisma previne automaticamente
7. **XSS**: React escapa automaticamente

## 📱 Responsividade

- **Mobile-first**: Tailwind breakpoints (sm, md, lg)
- **Tablet otimizado**: Grid 2-4 colunas, botões grandes
- **Desktop**: Sidebar fixa, layout 240px + 1fr

## 🚀 Deploy

### Recomendação: Vercel + Neon

1. **Frontend + APIs**: Vercel (serverless)
2. **Banco**: Neon (PostgreSQL serverless)
3. **Variáveis**:
   - `DATABASE_URL` (connection string Neon)
   - `JWT_SECRET` (segredo forte)

### Build Steps

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

## 🧪 Melhorias Futuras (Roadmap)

- [ ] Gráficos de produção (Recharts)
- [ ] WebSockets para atualização em tempo real
- [ ] PWA com cache offline (tablet)
- [ ] Export de relatórios (PDF via jsPDF)
- [ ] Multi-tenancy (várias empresas)
- [ ] OAuth (Google, Microsoft)
- [ ] Testes E2E (Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento (Sentry, LogRocket)

## 📝 Convenções de Código

- **Server Components**: padrão em App Router (fetch direto do Prisma)
- **Client Components**: apenas quando necessário (`'use client'`)
- **API Routes**: validação Zod → lógica → response JSON
- **Componentes UI**: reutilizáveis em `components/ui/`
- **Lib**: utilitários puros (prisma, auth, audit, validations)

---

**Última atualização**: Dezembro 2025
