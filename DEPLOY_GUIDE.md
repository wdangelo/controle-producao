# 🚀 Guia de Deploy - Vercel

## Pré-requisitos Completos ✅
- [x] Conta no Neon criada
- [x] Banco de dados PostgreSQL criado no Neon
- [x] Connection String copiada
- [x] Projeto preparado para deploy

---

## 📦 Parte 3: Subir Código para o GitHub

### Passo 1: Verificar se tem Git inicializado
```bash
git status
```

Se der erro "not a git repository", inicialize:
```bash
git init
git add .
git commit -m "Preparar projeto para deploy na Vercel"
```

### Passo 2: Criar repositório no GitHub
1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name**: `controle-producao`
   - **Description**: `Sistema de Controle de Produção`
   - **Visibility**: Pode ser **Public** ou **Private** (funciona nos dois)
3. **NÃO marque** "Initialize this repository with a README"
4. Clique em **"Create repository"**

### Passo 3: Conectar e enviar código
No terminal, execute os comandos que o GitHub mostrar:
```bash
git remote add origin https://github.com/SEU-USUARIO/controle-producao.git
git branch -M main
git push -u origin main
```

---

## 🎯 Parte 4: Deploy na Vercel

### Passo 1: Criar conta na Vercel
1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize a Vercel a acessar seus repositórios

### Passo 2: Importar Projeto
1. No dashboard da Vercel, clique em **"Add New..."**
2. Selecione **"Project"**
3. Procure por `controle-producao` na lista
4. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente
**IMPORTANTE:** Antes de fazer deploy, configure as variáveis:

1. Na tela de configuração, vá até **"Environment Variables"**
2. Adicione as seguintes variáveis (clique em "Add" para cada uma):

**DATABASE_URL**
```
cole_aqui_sua_connection_string_do_neon
```
Exemplo: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

**JWT_SECRET**
```
controle-producao-jwt-secret-change-in-production-min-32-chars-2024
```

**NODE_ENV**
```
production
```

### Passo 4: Fazer Deploy
1. Após adicionar as variáveis, clique em **"Deploy"**
2. Aguarde 2-5 minutos (a Vercel vai):
   - Instalar dependências
   - Gerar Prisma Client
   - Rodar migrations
   - Fazer build do Next.js
3. Quando terminar, verá: **"Congratulations!"** 🎉

### Passo 5: Acessar Aplicação
1. Clique no link gerado (será algo como `https://controle-producao-xxx.vercel.app`)
2. A aplicação estará no ar! 🚀

---

## 🌱 Parte 5: Popular Banco de Dados (IMPORTANTE!)

O banco está vazio! Precisa criar o usuário admin e dados iniciais.

### Opção 1: Via Vercel CLI (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Executar seed
vercel env pull
npm run prisma:seed
```

### Opção 2: Criar Admin Manualmente via Neon
1. Acesse o Neon dashboard
2. Clique em **"SQL Editor"**
3. Execute este SQL:

```sql
-- Criar admin
INSERT INTO "User" (id, nome, email, senha, data_criacao, data_alteracao)
VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@example.com',
  '$2a$10$YourHashedPasswordHere',
  NOW(),
  NOW()
);

-- Criar operadores de exemplo
INSERT INTO "Operator" (id, nome, codigo_operador, data_criacao, data_alteracao)
VALUES 
  (gen_random_uuid(), 'João Silva', '1001', NOW(), NOW()),
  (gen_random_uuid(), 'Maria Santos', '1002', NOW(), NOW());
```

**Nota:** Para gerar a senha hasheada do admin, use: https://bcrypt-generator.com
- Digite: `admin123`
- Copie o hash gerado e substitua em `$2a$10$YourHashedPasswordHere`

---

## ✅ Teste Final

1. Acesse sua URL da Vercel
2. Faça login com: `admin@example.com` / `admin123`
3. Crie um serviço de teste
4. Teste todas as funcionalidades

---

## 🔧 Troubleshooting

### Erro de Migration
Se der erro de migration durante deploy:
1. Vá em Vercel Dashboard → Project Settings → Environment Variables
2. Adicione: `SKIP_DB_PUSH=true`
3. Redeploy

### Erro 500 no Login
- Verifique se `DATABASE_URL` está correto
- Verifique se `JWT_SECRET` está configurado
- Veja logs: Vercel Dashboard → Deployments → Clique no deploy → Runtime Logs

### Banco Vazio
- Execute o seed conforme Parte 5

---

## 🎉 Pronto!

Seu sistema está no ar e acessível para qualquer pessoa com o link!

**URL final**: `https://seu-projeto.vercel.app`
