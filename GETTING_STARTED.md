# 🚀 Guia de Primeiro Uso - Controle de Produção

## ✅ Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL rodando (local ou Neon/Supabase)
- Git (opcional)

## 📦 Instalação

### 1. Instalar dependências

```powershell
cd c:\www\www\TWS\controle-producao
npm install --legacy-peer-deps
```

### 2. Configurar banco de dados

Crie o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/controle_producao"
JWT_SECRET="seu-segredo-forte-aqui-min-32-chars"
```

**Opções de banco:**

- **PostgreSQL local**: Instale via Docker ou PostgreSQL nativo
- **Neon (cloud)**: Crie conta gratuita em https://neon.tech
- **Supabase (cloud)**: https://supabase.com

### 3. Rodar migrations do Prisma

```powershell
npm run prisma:migrate
```

Isso criará todas as tabelas no banco.

### 4. Popular banco com dados iniciais (seed)

Primeiro instale dependências de desenvolvimento:

```powershell
npm install --save-dev tsx @types/bcryptjs @types/jsonwebtoken --legacy-peer-deps
```

Depois rode o seed:

```powershell
npm run prisma:seed
```

Isso criará:
- **Admin**: email `admin@example.com`, senha `admin123`
- **Operadores**: João Silva (código 1001), Maria Santos (código 1002)

### 5. Iniciar servidor de desenvolvimento

```powershell
npm run dev
```

Acesse: http://localhost:3000

## 🎯 Primeiros Passos

### 1. Fazer Login como Admin

1. Na home, clique em **"Login - Dashboard"**
2. Use as credenciais:
   - Email: `admin@example.com`
   - Senha: `admin123`
3. Você será redirecionado para `/dashboard`

### 2. Cadastrar Operadores

1. No menu lateral, clique em **"Operadores"**
2. Preencha o formulário:
   - Nome: ex. "Pedro Costa"
   - Código: ex. "1003" (4 dígitos)
3. Clique em **"Adicionar"**

### 3. Criar um Serviço/Projeto

1. No menu lateral, clique em **"Serviços"**
2. Preencha o formulário:
   - Cliente: ex. "Empresa XYZ"
   - Descrição: ex. "Peças de fundição para motor"
   - Tipo do metal: ex. "Alumínio"
   - Marca do material: ex. "Liga A380"
   - Previsão de preparo: ex. "2025-12-10"
3. Adicione peças:
   - Clique em **"Adicionar peça"**
   - Nome da peça: ex. "Tampa do motor"
   - Quantidade prevista: ex. 50
   - Repita para mais peças
4. Clique em **"Criar serviço"**

### 4. Testar Área do Operador (Tablet)

1. Abra uma **nova aba anônima** (ou outro navegador)
2. Acesse: http://localhost:3000/operador
3. Selecione um operador (ex. João Silva)
4. Selecione o serviço que você criou
5. Clique em **"Iniciar operação"**
6. Teste os botões:
   - **"Iniciar pausa para almoço"**
   - **"Finalizar pausa"**
   - **"+ 1"** para incrementar peças produzidas
   - **"Finalizar operação"**

### 5. Verificar Métricas

1. Volte ao dashboard (aba do admin)
2. Clique em **"Acompanhamento"**
3. Veja o ranking de operadores
4. Teste os filtros: Dia / Semana / Mês

## 🗄️ Prisma Studio (GUI do Banco)

Para visualizar e editar dados direto no banco:

```powershell
npm run prisma:studio
```

Abre em: http://localhost:5555

## 🛠️ Comandos Úteis

```powershell
# Desenvolvimento
npm run dev                  # Servidor dev

# Prisma
npm run prisma:generate      # Gerar Prisma Client
npm run prisma:migrate       # Criar/aplicar migrations
npm run prisma:studio        # Abrir Prisma Studio
npm run prisma:seed          # Popular banco

# Produção
npm run build                # Build produção
npm run start                # Servidor produção

# Linting
npm run lint                 # ESLint
```

## 🔧 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```powershell
npm run prisma:generate
```

### Erro: "P1001: Can't reach database server"

Verifique se:
1. PostgreSQL está rodando
2. `DATABASE_URL` no `.env` está correto
3. Firewall permite conexão na porta 5432

### Erro: "JWT_SECRET is not defined"

Adicione no `.env`:
```
JWT_SECRET="seu-segredo-min-32-chars-aqui"
```

### Erro de SSL no npm (corporativo)

```powershell
npm config set strict-ssl false
npm install --legacy-peer-deps
```

### Portas em uso

Se a porta 3000 estiver ocupada, defina outra:

```powershell
$env:PORT=3001; npm run dev
```

## 📚 Documentação Adicional

- [README.md](./README.md) - Visão geral do projeto
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura detalhada
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 🎨 Customização

### Mudar cores (Tailwind)

Edite `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#0ea5e9', // Sua cor aqui
        600: '#0284c7',
      }
    }
  }
}
```

### Adicionar logo

1. Coloque logo em `public/logo.png`
2. Edite `app/layout.tsx` ou componentes

### Mudar idioma

Todas as strings estão hardcoded em português. Para i18n, considere `next-intl`.

## 🚀 Deploy em Produção

Ver [README.md](./README.md) seção "Deploy (Vercel + Neon)".

## 💡 Dicas

- Use **Prisma Studio** para debug rápido
- Área do operador é **sem login** (por design)
- Dashboard **requer autenticação** (middleware)
- Auditoria registra mudanças automaticamente
- Use **filtros de data** nas métricas para análises

---

**Pronto para usar!** 🎉

Se tiver dúvidas, consulte a documentação ou abra uma issue.
