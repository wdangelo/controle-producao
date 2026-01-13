# Copilot Instructions - Controle de Produção

## Project Overview
Production control system for foundry machines tracking operator sessions, piece production, and real-time metrics. Built with Next.js 14 (App Router), Prisma + PostgreSQL, JWT auth, and Docker deployment.

## Architecture Patterns

### API Routes Structure
- **RESTful conventions**: CRUD endpoints follow pattern `/api/{resource}/[id]`
- **Dual content-type support**: All POST routes accept both `application/json` and `multipart/form-data` (see [app/api/auth/login/route.ts](app/api/auth/login/route.ts#L6-L12))
- **Error responses**: Return `{ error: 'message' }` with appropriate HTTP status codes
- **Validation**: Use Zod schemas from [lib/validations.ts](lib/validations.ts) with `.safeParse()` pattern

### Authentication Flow
- JWT tokens stored in **HttpOnly cookies** named `auth` (see [lib/auth.ts](lib/auth.ts))
- `JWT_SECRET` environment variable (default: `'dev-secret-change-me'` for dev)
- Middleware checks token presence for `/dashboard/*` routes but **does NOT verify** (Edge Runtime limitation) - see [middleware.ts](middleware.ts#L7-L8)
- Full JWT verification happens in API routes using `verifyJwt()` when needed

### Database Conventions
- **UUID primary keys** for all models (not autoincrement)
- **Portuguese field names** in schema: `nome`, `codigo_operador`, `data_criacao`, `quantidade_prevista`
- **Cascade deletes**: Service → Pieces, OperationSession, etc.
- Prisma Client singleton pattern in [lib/prisma.ts](lib/prisma.ts) prevents multiple instances in dev

### Production Tracking Business Logic
- **Session lifecycle**: `start` → `pause` (almoco) → `resume` → `end` (see [app/api/production/sessions/route.ts](app/api/production/sessions/route.ts))
- **Production counts**: Two-step process - `action: 'start'` creates record with `inicio_producao`, then `action: 'finish'` sets `fim_producao` and calculates `tempo_producao_segundos`
- **Auto-completion**: Service automatically marked `concluido: true` when total produced >= total previsto (see [app/api/production/counts/route.ts](app/api/production/counts/route.ts#L6-L49))
- **Time calculations**: Use functions from [lib/time-calculations.ts](lib/time-calculations.ts) - `calculateSessionDuration()` subtracts lunch breaks

### Real-time Sync Pattern
- Operator interface polls **every 1 second** using `setInterval()` (see [app/operador/[operatorId]/[serviceId]/page.tsx](app/operador/[operatorId]/[serviceId]/page.tsx))
- Loads service data, session state, and aggregated production totals in parallel
- Displays both **total production** (all operators) and **my production** (current operator)

### Audit Logging
- Use `auditLog()` helper from [lib/audit.ts](lib/audit.ts) for CREATE/UPDATE/DELETE actions
- Stores `before` and `after` JSON snapshots
- `actorUserId` tracks which admin performed action (extract from JWT in protected routes)

## Development Workflows

### Database Changes
```bash
# After editing schema.prisma
npm run prisma:migrate      # Creates migration + applies
npm run prisma:generate     # Regenerates Prisma Client
npm run prisma:seed         # Seed test data (see prisma/seed.ts)
```

### Docker Development
```bash
npm run docker:up           # Start postgres + app containers
npm run docker:logs         # Follow logs
npm run docker:down         # Stop and remove containers
```

### Testing Credentials
- Admin: `admin@example.com` / `admin123`
- Operators: `operador1@example.com` / `op123` (and operador2)

## Environment Variables
Required in `.env.local` (dev) or docker-compose.yml (production):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Min 32 chars for production (default dev: `'dev-secret-change-me'`)

## Common Patterns

### Fetching Related Data
Always `include` relations in Prisma queries to avoid N+1:
```typescript
const service = await prisma.service.findUnique({
  where: { id: serviceId },
  include: { pecas: true, sessions: true }
})
```

### Operator Code Validation
Operator codes are exactly **4 digits** (regex: `/^\d{4}$/`) - see [lib/validations.ts](lib/validations.ts#L15-L18)

### Date Formatting
Portuguese locale: `new Date().toLocaleString('pt-BR')`

## Key Files Reference
- Authentication logic: [lib/auth.ts](lib/auth.ts)
- Data validation schemas: [lib/validations.ts](lib/validations.ts)
- Database client: [lib/prisma.ts](lib/prisma.ts)
- Production time calculations: [lib/time-calculations.ts](lib/time-calculations.ts)
- Audit helper: [lib/audit.ts](lib/audit.ts)
- Database schema: [prisma/schema.prisma](prisma/schema.prisma)
- Docker setup: [docker-compose.yml](docker-compose.yml), [Dockerfile](Dockerfile)
