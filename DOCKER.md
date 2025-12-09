# 🐳 Guia Docker - Controle de Produção

## 🚀 Início Rápido

### 1. Subir todo o ambiente (banco + app)

```powershell
npm run docker:build
```

Isso irá:
- ✅ Criar o container PostgreSQL
- ✅ Criar o container da aplicação Next.js
- ✅ Rodar as migrations automaticamente
- ✅ Popular o banco com dados iniciais (seed)
- ✅ Iniciar a aplicação

**Acesse:** http://localhost:3000

**Login padrão:**
- Email: `admin@example.com`
- Senha: `admin123`

---

## 📋 Comandos Úteis

### Gerenciamento básico

```powershell
# Subir containers
npm run docker:up

# Parar containers
npm run docker:down

# Ver logs em tempo real
npm run docker:logs

# Rebuild (após mudanças no código)
npm run docker:build
```

### Comandos Docker Compose diretos

```powershell
# Status dos containers
docker-compose ps

# Parar tudo e remover volumes (CUIDADO: apaga o banco!)
docker-compose down -v

# Apenas banco (para dev local)
docker-compose up -d postgres

# Acessar shell do container
docker exec -it controle-producao-app sh
docker exec -it controle-producao-db psql -U postgres -d controle_producao
```

---

## 🗄️ Apenas Banco (Desenvolvimento Local)

Se você quer rodar apenas o PostgreSQL no Docker e o Next.js localmente:

```powershell
# 1. Subir só o banco
docker-compose up -d postgres

# 2. Aguardar o banco estar pronto
Start-Sleep -Seconds 5

# 3. Rodar migrations
npm run prisma:migrate

# 4. Popular dados
npm run prisma:seed

# 5. Rodar app localmente
npm run dev
```

**Vantagens:**
- Hot reload funciona normalmente
- Debugging mais fácil
- Banco isolado e reprodutível

---

## 🔧 Configuração

### Variáveis de Ambiente

Edite `.env` para configurações locais:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/controle_producao"
JWT_SECRET="seu-segredo-aqui-min-32-chars"
```

Edite `docker-compose.yml` para ambiente containerizado (já configurado).

### Portas

- **App:** 3000
- **PostgreSQL:** 5432

Para mudar, edite `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # App na porta 3001
  - "5433:5432"  # Postgres na porta 5433
```

---

## 🐛 Troubleshooting

### Porta 5432 já em uso

Se você tem PostgreSQL local rodando:

**Opção 1:** Pare o PostgreSQL local
```powershell
Stop-Service postgresql-x64-15  # Ajuste o nome do serviço
```

**Opção 2:** Mude a porta no `docker-compose.yml`
```yaml
ports:
  - "5433:5432"
```

E no `.env`:
```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/controle_producao"
```

### Porta 3000 já em uso

```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3000

# Matar o processo (substitua PID)
taskkill /PID <numero> /F
```

### Erro "Cannot connect to database"

```powershell
# Ver logs do banco
docker logs controle-producao-db

# Verificar se está rodando
docker ps

# Restart
docker-compose restart postgres
```

### Limpar tudo e recomeçar

```powershell
# Para e remove containers + volumes
docker-compose down -v

# Remove imagens
docker rmi controle-producao-app

# Rebuild do zero
npm run docker:build
```

---

## 📊 Prisma Studio (GUI do Banco)

Com o banco rodando no Docker:

```powershell
npm run prisma:studio
```

Acesse: http://localhost:5555

---

## 🔄 Workflow de Desenvolvimento

### Cenário 1: Full Docker (Produção-like)

```powershell
# Fazer mudanças no código
# ...

# Rebuild
npm run docker:build

# Ver logs
npm run docker:logs
```

### Cenário 2: Apenas Banco no Docker (Recomendado para dev)

```powershell
# Uma vez: subir banco
docker-compose up -d postgres

# Desenvolver normalmente
npm run dev

# Hot reload funciona! 🔥
```

---

## 📦 Volumes

Dados persistem em volumes Docker:

```powershell
# Listar volumes
docker volume ls

# Inspecionar volume do banco
docker volume inspect controle-producao_postgres_data

# Backup do banco
docker exec controle-producao-db pg_dump -U postgres controle_producao > backup.sql

# Restaurar backup
Get-Content backup.sql | docker exec -i controle-producao-db psql -U postgres -d controle_producao
```

---

## 🚀 Deploy (Produção)

Para deploy em servidor:

1. **Copie os arquivos:**
   - `docker-compose.yml`
   - `.env` (com valores de produção)
   - Todo o código fonte

2. **No servidor:**
   ```bash
   docker-compose up -d
   ```

3. **SSL/HTTPS:**
   - Use Nginx reverse proxy
   - Ou Traefik
   - Ou Caddy (mais simples)

---

## 💡 Dicas

- Use `docker-compose logs -f app` para ver apenas logs da aplicação
- `docker stats` mostra uso de CPU/RAM dos containers
- Adicione `.env` no `.gitignore` (já está)
- Para CI/CD, use GitHub Actions + Docker Hub

---

**Ambiente Docker configurado e pronto! 🐳**
