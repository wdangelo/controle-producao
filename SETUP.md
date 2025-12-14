# 🚀 Guia Rápido de Instalação - Controle de Produção

## 📋 Pré-requisitos

- **Docker Desktop** instalado e rodando (Windows/Mac/Linux)
- **Git** (opcional, para clonar o repositório)

---

## 🏭 Modo Produção (Docker) - Recomendado

### 1️⃣ Primeira Vez - Instalação Completa

```powershell
# 1. Clone o repositório (se ainda não tiver)
git clone <url-do-repositório>
cd controle-producao

# 2. Crie o arquivo .env (copie do exemplo)
Copy-Item .env.example .env

# 3. Suba os containers (banco + aplicação)
docker-compose up --build -d

# 4. Aguarde ~2 minutos e acesse:
# http://localhost:3000
```

**Login padrão:**
- Email: `admin@example.com`
- Senha: `admin123`

### 2️⃣ Comandos Úteis

```powershell
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f app

# Parar tudo
docker-compose down

# Reiniciar após mudanças no código
docker-compose up --build -d

# Parar e APAGAR TODOS OS DADOS (cuidado!)
docker-compose down -v
```

### 3️⃣ Portas Utilizadas

- **Aplicação:** http://localhost:3000
- **PostgreSQL:** localhost:5432

---

## 💻 Modo Desenvolvimento (Local)

### 1️⃣ Instalação

```powershell
# 1. Instale as dependências
npm install

# 2. Suba APENAS o banco de dados no Docker
docker-compose up -d postgres

# 3. Aguarde o banco iniciar (10 segundos)
Start-Sleep -Seconds 10

# 4. Rode as migrations
npm run prisma:migrate

# 5. Popule o banco com dados iniciais
npm run prisma:seed

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

**Acesse:** http://localhost:3000

### 2️⃣ Comandos de Desenvolvimento

```powershell
# Iniciar servidor (com hot reload)
npm run dev

# Gerar Prisma Client após mudanças no schema
npm run prisma:generate

# Criar/aplicar migrations
npm run prisma:migrate

# Abrir Prisma Studio (GUI do banco)
npm run prisma:studio

# Rodar linter
npm run lint

# Build de produção (sem Docker)
npm run build
npm start
```

---

## 🔧 Variáveis de Ambiente (.env)

```env
# URL do banco (ajuste conforme necessário)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/controle_producao"

# JWT Secret (mínimo 32 caracteres para produção)
JWT_SECRET="controle-producao-jwt-secret-change-in-production-min-32-chars"

# Ambiente
NODE_ENV="development"
```

---

## 🐛 Resolução de Problemas

### ❌ Erro: "port 3000 is already allocated"
```powershell
# Parar containers e tentar novamente
docker-compose down
docker-compose up -d
```

### ❌ Erro: "port 5432 is already allocated"
```powershell
# Algum PostgreSQL está rodando. Pare ou mude a porta no docker-compose.yml
```

### ❌ Container reiniciando constantemente
```powershell
# Ver logs para identificar o erro
docker logs controle-producao-app --tail 50

# Se for problema de migrations, recrie o banco:
docker-compose down -v
docker-compose up --build -d
```

### ❌ Erro ao rodar migrations localmente
```powershell
# Certifique-se que o banco Docker está rodando
docker-compose ps

# Se não estiver, suba o banco:
docker-compose up -d postgres

# Tente novamente
npm run prisma:migrate
```

---

## 📦 Estrutura do Projeto

```
controle-producao/
├── app/                    # Páginas e rotas Next.js
│   ├── api/               # API Routes (backend)
│   ├── dashboard/         # Painel administrativo
│   ├── operador/          # Interface do operador
│   └── login/             # Tela de login
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilitários (auth, prisma, validações)
├── prisma/                # Schema e migrations do banco
│   ├── schema.prisma      # Definição do modelo de dados
│   ├── seed.ts            # Dados iniciais
│   └── migrations/        # Histórico de alterações no banco
├── docker-compose.yml     # Configuração Docker
├── Dockerfile             # Imagem da aplicação
└── .env                   # Variáveis de ambiente (criar)
```

---

## 🎯 Próximos Passos

1. **Acesse o sistema:** http://localhost:3000
2. **Faça login** com as credenciais padrão
3. **Explore o Dashboard** em `/dashboard`
4. **Cadastre operadores** em `/dashboard/operators`
5. **Crie serviços** em `/dashboard/services`
6. **Teste a interface do operador** em `/operador`

---

## 🆘 Suporte

- **Documentação completa:** Veja `DOCKER.md`, `GETTING_STARTED.md`, `ARCHITECTURE.md`
- **Problemas?** Verifique os logs: `docker-compose logs -f`
- **Dúvidas?** Consulte o `README.md`

---

## ⚡ Quick Reference

```powershell
# PRODUÇÃO (Docker)
docker-compose up --build -d   # Iniciar tudo
docker-compose ps              # Ver status
docker-compose logs -f app     # Ver logs
docker-compose down            # Parar tudo

# DESENVOLVIMENTO (Local)
npm run dev                    # Iniciar servidor
npm run prisma:studio          # Abrir GUI do banco
npm run prisma:migrate         # Aplicar migrations

# UTILITÁRIOS
docker-compose restart app     # Reiniciar apenas app
docker exec -it controle-producao-db psql -U postgres -d controle_producao  # Acessar banco
```
