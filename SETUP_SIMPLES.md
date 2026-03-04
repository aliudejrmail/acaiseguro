# 🔧 SETUP RÁPIDO - Sem linha de comando

## ⚡ Método Simplificado (Recomendado)

Se você recebeu o erro **"psql não é reconhecido como comando"**, siga este guia:

---

## 📋 Pré-requisitos

1. **PostgreSQL instalado**
   - Se não tiver: https://www.postgresql.org/download/windows/
   - Durante instalação, anote a senha do usuário `postgres`

2. **Node.js instalado**
   - Se não tiver: https://nodejs.org/
   - Baixe a versão LTS

---

## 🚀 PASSO A PASSO

### 1️⃣ Instalar Dependências do Servidor

Abra o PowerShell na pasta do projeto e execute:

```powershell
cd c:\projetos_web\vig_bat_acai\server
npm install
```

Aguarde a instalação terminar.

---

### 2️⃣ Configurar o Banco de Dados (pgAdmin)

**Abra o pgAdmin** (já vem instalado com PostgreSQL):

1. **Criar o Banco de Dados:**
   - Clique com botão direito em **"Databases"**
   - Selecione **"Create" > "Database..."**
   - Nome: `acaiseguro`
   - Clique em **"Save"**

2. **Executar o Schema:**
   - Clique no banco `acaiseguro` (lado esquerdo)
   - No menu superior: **"Tools" > "Query Tool"**
   - Clique no ícone de **pasta** (ou Ctrl+O)
   - Navegue até: `c:\projetos_web\vig_bat_acai\sql\schema.sql`
   - Clique em **"Abrir"**
   - Clique no ícone ▶️ **"Execute"** (ou pressione F5)
   - Aguarde a mensagem de sucesso

3. **Verificar se funcionou:**
   - No menu lateral esquerdo, expanda: `acaiseguro > Schemas > public > Tables`
   - Você deve ver 5 tabelas:
     - `batedores`
     - `checklists`
     - `calculos_cloracao`
     - `selos`
     - `requisitos_selos`

---

### 3️⃣ Configurar Credenciais

1. Navegue até: `c:\projetos_web\vig_bat_acai\server\`

2. Crie uma cópia do arquivo `.env.example` e renomeie para `.env`
   - **Pode fazer pelo Windows Explorer**

3. Abra o arquivo `.env` com Bloco de Notas e edite:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI    ← MUDE AQUI!
DB_NAME=acaiseguro

PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Substitua `SUA_SENHA_AQUI` pela senha que você definiu na instalação do PostgreSQL.

4. Salve o arquivo

---

### 4️⃣ Iniciar o Servidor

**Opção A - Com o script:**
```powershell
cd c:\projetos_web\vig_bat_acai
.\start-server.bat
```

**Opção B - Manual:**
```powershell
cd c:\projetos_web\vig_bat_acai\server
npm run dev
```

Você deve ver:
```
╔═══════════════════════════════════════╗
║   🍇 API AÇAÍ SEGURO 🍇              ║
║   Servidor rodando em:                ║
║   http://localhost:3000              ║
╚═══════════════════════════════════════╝
```

---

### 5️⃣ Abrir o Aplicativo

**Localize o arquivo:**
```
c:\projetos_web\vig_bat_acai\index.html
```

**Clique duas vezes** para abrir no navegador.

---

## ✅ Verificar se está Funcionando

### Teste 1: API
Abra no navegador: http://localhost:3000

Deve mostrar:
```json
{
  "message": "API Açaí Seguro está rodando! 🍇"
}
```

### Teste 2: Banco de Dados
No pgAdmin, execute:
```sql
SELECT * FROM batedores;
```

Deve retornar vazio (sem erros).

### Teste 3: Frontend
1. Abra `index.html`
2. Vá em "Cadastro"
3. Preencha o formulário
4. Clique em "Salvar Cadastro"
5. Verifique se aparece mensagem de sucesso

---

## 🐛 Problemas Comuns

### ❌ "npm não é reconhecido"
**Solução:** Instale o Node.js: https://nodejs.org/

### ❌ "Erro ao conectar no banco"
**Soluções:**
1. Verifique se o PostgreSQL está rodando
2. Confira a senha no arquivo `.env`
3. Teste a conexão no pgAdmin

### ❌ "Port 3000 already in use"
**Solução:** Mude a porta no `.env`:
```env
PORT=3001
```

### ❌ "Cannot find module"
**Solução:**
```powershell
cd server
npm install
```

### ❌ Frontend não salva dados
**Solução:**
1. Verifique se o servidor está rodando (http://localhost:3000)
2. Abra o Console do navegador (F12) e veja os erros
3. Se houver erro de CORS, reinicie o servidor

---

## 📊 Verificar Dados no Banco

Abra o pgAdmin > Query Tool e execute:

```sql
-- Ver todos os batedores
SELECT * FROM batedores;

-- Ver check-lists
SELECT * FROM checklists ORDER BY data_checklist DESC LIMIT 10;

-- Ver selos
SELECT * FROM selos;

-- Ver estatísticas
SELECT * FROM v_estatisticas_conformidade;
```

---

## 🎯 Resumo dos Comandos

```powershell
# Instalar dependências (uma vez só)
cd c:\projetos_web\vig_bat_acai\server
npm install

# Iniciar servidor (toda vez que for usar)
cd c:\projetos_web\vig_bat_acai
.\start-server.bat

# Ou manualmente:
cd server
npm run dev
```

---

## 📚 Próximos Passos

1. ✅ Teste todas as funcionalidades do aplicativo
2. ✅ Preencha alguns check-lists
3. ✅ Tente obter as certificações
4. ✅ Explore as estatísticas

---

## 💡 Dica: Adicionar PostgreSQL ao PATH (Opcional)

Se quiser usar os scripts automáticos no futuro:

1. **Localize a pasta bin do PostgreSQL:**
   - Normalmente: `C:\Program Files\PostgreSQL\16\bin`

2. **Adicionar ao PATH:**
   - Pesquise "Variáveis de Ambiente" no Windows
   - Clique em "Editar variáveis de ambiente do sistema"
   - Clique em "Variáveis de Ambiente"
   - Em "Variáveis do sistema", selecione "Path"
   - Clique em "Editar"
   - Clique em "Novo"
   - Cole o caminho: `C:\Program Files\PostgreSQL\16\bin`
   - Clique em "OK" em todas as janelas

3. **Reinicie o terminal**

4. **Teste:**
   ```powershell
   psql --version
   ```

---

**🎉 Pronto! Sistema configurado e funcionando!**

Para dúvidas, consulte: [SETUP.md](SETUP.md)
