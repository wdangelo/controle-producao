# 🧪 Guia de Testes - Controle de Produção

Este documento descreve como testar o sistema em diferentes cenários.

## ✅ Setup para Testes

### 1. Iniciar o Sistema

```powershell
# Terminal 1: Backend
npm run dev

# Terminal 2 (se necessário): Verificar logs
docker-compose logs -f db
```

### 2. Acessar Sistema

- **Admin Login:** http://localhost:3001
  - Email: `admin@example.com`
  - Senha: `admin123`

- **Operador 1:** http://localhost:3001
  - Email: `operador1@example.com`
  - Senha: `op123`

- **Operador 2:** http://localhost:3001
  - Email: `operador2@example.com`
  - Senha: `op123`

---

## 🧪 Cenário 1: Teste de Autenticação

### Passo 1: Login com falha
1. Acesse `/`
2. Tente login com credencial incorreta
3. **Esperado:** Mensagem de erro, permanece em login

### Passo 2: Login com sucesso
1. Email: `admin@example.com`, Senha: `admin123`
2. **Esperado:** Redireciona para `/dashboard`

### Passo 3: Cookie HttpOnly
1. Abra DevTools (F12) → Console
2. Digite: `document.cookie`
3. **Esperado:** Vazio (cookies HttpOnly não aparecem em JS)
4. → Network tab: Verifique cabeçalho `Set-Cookie` no login

---

## 🧪 Cenário 2: CRUD de Serviços

### Passo 1: Criar Serviço
1. Dashboard → Serviços
2. Clique "Novo Serviço"
3. Preencha:
   - Cliente: "Fundição XYZ"
   - Descrição: "Fundição de peças em alumínio"
   - Observações: "Atenção à temperatura"
   - Data Previsão Entrega: Selecione data
4. Clique "+ Adicionar Peça"
5. Preencha peça 1:
   - Nome: "Corpo da bomba"
   - Qty Prevista: 100
   - Tipo Metal: "Alumínio"
   - Marca Material: "ABC Metals"
6. Clique "+ Adicionar Peça"
7. Preencha peça 2:
   - Nome: "Rotor"
   - Qty Prevista: 50
   - Tipo Metal: "Alumínio"
   - Marca Material: "ABC Metals"
8. Clique "Salvar"
9. **Esperado:** Serviço aparece na lista

### Passo 2: Expandir serviço
1. Na lista de serviços, clique "2 peça(s)"
2. **Esperado:** Expande mostrando:
   - Corpo da bomba (100un, Alumínio, ABC Metals)
   - Rotor (50un, Alumínio, ABC Metals)

### Passo 3: Editar peça
1. Clique no ícone de edição na peça
2. Mude Qty para 150
3. Clique "Salvar"
4. **Esperado:** Serviço atualizado (agora 150)

### Passo 4: Remover peça
1. Clique no botão "×" (redondo, vermelho)
2. **Esperado:** Peça removida, total atualiza

---

## 🧪 Cenário 3: Operador Selecionando Serviço

### Passo 1: Logout e Login como Operador
1. Dashboard → Sair
2. Login com:
   - Email: `operador1@example.com`
   - Senha: `op123`
3. **Esperado:** Redireciona para `/operador/[id]`

### Passo 2: Ver Serviços Disponíveis
1. Página mostra "Olá, [Nome do Operador]!"
2. Aparecem cards com serviços:
   - Cliente
   - Descrição
   - Badge com número de peças
   - Observações
   - Data de Entrega
3. **Esperado:** Card do serviço criado aparece

### Passo 3: Clicar em Serviço
1. Clique no card do serviço
2. **Esperado:** Vai para `/operador/[id]/[serviceId]` (página de produção)

---

## 🧪 Cenário 4: Registrar Produção (Operador Único)

### Passo 1: Iniciar Produção
1. Na página de produção, vê:
   - Nome do Serviço
   - Peças com:
     - Nome (ex: "Corpo da bomba")
     - Previsto: 100
     - Produzido: 0
     - Saldo: 100
   - Botões: "+ 1", "+ 5", "+ 10"
2. Clique "Iniciar Produção"
3. **Esperado:** Botão muda para "Pausar", session iniciada

### Passo 2: Adicionar Peças
1. Para "Corpo da bomba", clique "+ 5"
2. **Esperado:** 
   - Produzido: 5
   - Saldo: 95
3. Clique "+ 1" 5 vezes
4. **Esperado:** 
   - Produzido: 10
   - Saldo: 90

### Passo 3: Pausar e Resumir
1. Clique "Pausar"
2. **Esperado:** Botão muda para "Retomar"
3. Clique "Retomar"
4. **Esperado:** Volta a "Pausar", sessão retomada

### Passo 4: Finalizar Sessão
1. Clique "Finalizar Sessão"
2. **Esperado:** 
   - Session finalizada
   - Totais salvos em banco
   - Redireciona para `/operador/[id]`

---

## 🧪 Cenário 5: Sincronização em Tempo Real (Multi-Operador) 🔥

### ⚠️ Teste Crítico para Produção

**Objetivo:** Validar que múltiplos operadores sincronizam em tempo real

### Passo 1: Preparação
1. Crie serviço novo com 2 peças (veja Cenário 2)
2. Anote o `serviceId`

### Passo 2: Abra 2 Navegadores

**Browser 1 (Operador 1):**
1. Login com `operador1@example.com`
2. Navegue até o serviço novo
3. Clique "Iniciar Produção"

**Browser 2 (Operador 2):**
1. Login em tab/janela diferente com `operador2@example.com`
2. Navegue até **MESMO SERVIÇO**
3. Clique "Iniciar Produção"

### Passo 3: Teste de Sincronização

**No Browser 1:**
1. Para peça 1, clique "+ 5"
2. Verifique que mostra "Produzido: 5"

**No Browser 2:**
1. **Observar por 1-2 segundos**
2. **Esperado:** Totais atualizam automaticamente:
   - Peça 1: Produzido agora mostra 5 (mesmo operador 1 adicionando)
   - Saldo: reduz de 100 para 95

**No Browser 1:**
1. Para peça 1, clique "+ 10"
2. Verifique que mostra "Produzido: 15"

**No Browser 2:**
1. **Observar por 1-2 segundos**
2. **Esperado:** Atualiza automaticamente:
   - Peça 1: Produzido agora mostra 15
   - Saldo: reduz de 95 para 85

### Passo 4: Verificar Polling
1. Abra DevTools (F12) → Network
2. Filtre por `XHR` ou `Fetch`
3. **Esperado:** Requisições para `/api/production/totals` a cada ~1 segundo

---

## 🧪 Cenário 6: Persistência de Sessão

### Passo 1: Iniciar Produção
1. Login como `operador1@example.com`
2. Selecione serviço
3. Clique "Iniciar Produção"
4. Adicione 20 peças da peça 1
5. **Esperado:**
   - Produzido: 20
   - Saldo: 80

### Passo 2: Fechar Navegador
1. Feche a aba (ou F5 refresh)
2. **Esperado:**
   - Página recarrega
   - Produção **NÃO RESET** para 0

### Passo 3: Verificar Estado Restaurado
1. Após reload, deve aparecer:
   - Produzido: 20
   - Saldo: 80
   - **Botão em "Pausar"** (session ativa)
2. **Esperado:** Estado exato anterior ao refresh

### Passo 4: Retomar Trabalho
1. Adicione mais "+ 5"
2. **Esperado:**
   - Produzido: 25
   - Saldo: 75

---

## 🧪 Cenário 7: Dashboard de Acompanhamento

### Passo 1: Acessar Métricas
1. Login como Admin
2. Dashboard → "Acompanhamento"
3. **Esperado:** Página carrega com:
   - Cards KPI (Total Produzido, Operadores Ativos, Média)
   - Tabela com operadores e peças produzidas

### Passo 2: Atualizar Dados em Tempo Real
1. Deixe a página aberta
2. Em outro navegador, operador adiciona peças
3. Clique "Atualizar Dados" em Admin
4. **Esperado:** Totais aumentam

### Passo 3: Visualizar por Serviço
1. Vê cada serviço com seus operadores
2. Total de produção do operador
3. Detalhes de cada peça

---

## 🧪 Cenário 8: Logout

### Passo 1: Logout
1. Dashboard → "Sair"
2. **Esperado:** Redireciona para `/`

### Passo 2: Tentar Acessar /dashboard
1. Tente acessar `/dashboard` manualmente
2. **Esperado:** Redireciona para `/` (middleware protege)

---

## ✅ Checklist de Validação Final

| Teste | Status | Notas |
|-------|--------|-------|
| Login funciona | ☐ | |
| Dashboard acessível após login | ☐ | |
| CRUD Serviços | ☐ | |
| CRUD Peças (dentro de serviço) | ☐ | |
| Operador vê serviços | ☐ | |
| Registrar produção (single op) | ☐ | |
| Sincronização multi-operador | ☐ | **CRÍTICO** |
| Totais atualizam a cada 1s | ☐ | Verificar Network tab |
| Sessão persiste após refresh | ☐ | |
| Acompanhamento mostra dados | ☐ | |
| Logout funciona | ☐ | |
| Middleware protege rotas | ☐ | |

---

## 🐛 Debugging

### Ver Logs do Backend
```powershell
# Terminal onde npm run dev está rodando
# Procure por:
# - "POST /api/auth/login"
# - "GET /api/production/totals"
# - "POST /api/production/counts"
```

### Ver Requisições Network
```javascript
// DevTools → Console
// Monitorar requisições:
fetch('http://localhost:3001/api/services')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Verificar Estado do Banco
```bash
# Se usando Docker
docker-compose exec db psql -U postgres -d controle_producao

# Queries úteis:
SELECT * FROM "OperationSession" ORDER BY "data_inicio" DESC LIMIT 5;
SELECT * FROM "ProductionCount" ORDER BY "createdAt" DESC LIMIT 10;
SELECT COUNT(*) FROM "ProductionCount";
```

---

## 📊 Resumo de Métricas Esperadas

**Após cenário completo:**
- Total produzido: 50-100+ peças
- Operadores ativos: 2
- Serviços: 1-2
- Sessions: 2 (uma por operador)
- Production counts: 50-100+ registros

---

**Atualizado:** 2024
**Versão:** 1.0
