# 🚀 Guia de Instalação e Configuração - Açaí Seguro

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **PostgreSQL** (versão 12 ou superior)
   - Download: https://www.postgresql.org/download/
   - Durante a instalação, anote a senha do usuário `postgres`

2. **Node.js** (versão 14 ou superior)
   - Download: https://nodejs.org/
   - Verificar instalação: `node --version` e `npm --version`

3. **Navegador moderno** (Chrome, Firefox, Edge ou Safari)

---

## 🗄️ Passo 1: Configurar o Banco de Dados PostgreSQL

### 1.1. Criar o Banco de Dados

Abra o `psql` ou pgAdmin e execute:

```sql
CREATE DATABASE acaiseguro;
```

### 1.2. Executar o Schema

Navegue até a pasta `sql` do projeto e execute o arquivo `schema.sql`:

**Opção 1 - Via psql (Linha de comando):**
```bash
psql -U postgres -d acaiseguro -f sql/schema.sql
```

**Opção 2 - Via pgAdmin:**
1. Conecte-se ao banco `acaiseguro`
2. Vá em Tools > Query Tool
3. Abra o arquivo `sql/schema.sql`
4. Execute (F5)

### 1.3. Verificar Tabelas Criadas

Execute no psql ou pgAdmin:
```sql
\dt
```

Você deve ver as seguintes tabelas:
- `batedores`
- `checklists`
- `calculos_cloracao`
- `selos`
- `requisitos_selos`

---

## ⚙️ Passo 2: Configurar o Servidor Backend

### 2.1. Navegar até a pasta do servidor

```bash
cd c:\projetos_web\vig_bat_acai\server
```

### 2.2. Instalar Dependências

```bash
npm install
```

Aguarde a instalação dos pacotes:
- express
- pg (driver PostgreSQL)
- dotenv
- cors
- body-parser
- nodemon (para desenvolvimento)

### 2.3. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:

**Windows:**
```bash
copy .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=acaiseguro

PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Substitua `SUA_SENHA_AQUI` pela senha que você definiu durante a instalação do PostgreSQL.

### 2.4. Iniciar o Servidor

**Modo Desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo Produção:**
```bash
npm start
```

Você deve ver a mensagem:

```
╔═══════════════════════════════════════╗
║                                       ║
║   🍇 API AÇAÍ SEGURO 🍇              ║
║                                       ║
║   Servidor rodando em:                ║
║   http://localhost:3000              ║
║                                       ║
║   Ambiente: development              ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## 🌐 Passo 3: Testar a API

### 3.1. Testar Health Check

Abra seu navegador e acesse:
```
http://localhost:3000
```

Você deve ver uma resposta JSON com informações da API.

### 3.2. Testar Endpoints

**Via navegador ou Postman:**

- **Health Check:** `GET http://localhost:3000/`
- **Listar batedor:** `GET http://localhost:3000/api/batedor/:cpf`

---

## 🎨 Passo 4: Executar o Frontend

### 4.1. Abrir o Aplicativo

Simplesmente abra o arquivo `index.html` no navegador:

**Windows:**
```bash
start index.html
```

**Ou clique duas vezes** no arquivo `index.html` na pasta `c:\projetos_web\vig_bat_acai\`

### 4.2. Usar o Aplicativo

1. **Complete seu cadastro** no módulo "Cadastro"
2. O CPF será usado como identificador único
3. Todas as operações serão sincronizadas com o banco de dados
4. Se a API estiver offline, o sistema funciona com cache local (LocalStorage)

---

## 🔧 Estrutura do Projeto

```
vig_bat_acai/
│
├── index.html              # Frontend principal
├── css/
│   └── styles.css          # Estilos
├── js/
│   ├── app.js              # Lógica do frontend
│   └── database.js         # Camada de comunicação com API
│
├── server/                 # Backend Node.js
│   ├── server.js           # Servidor Express
│   ├── package.json        # Dependências
│   ├── .env                # Configurações (NÃO COMITAR!)
│   └── config/
│       └── database.js     # Conexão PostgreSQL
│   └── routes/
│       └── api.js          # Rotas da API REST
│
├── sql/
│   └── schema.sql          # Estrutura do banco de dados
│
└── README.md
```

---

## 📡 Endpoints da API

### Batedores (Cadastro)
- `GET /api/batedor/:cpf` - Buscar batedor
- `POST /api/batedor` - Criar/atualizar batedor

### Check-lists
- `GET /api/checklists/:cpf?dias=30` - Listar checklists
- `POST /api/checklist` - Salvar checklist

### Cálculos de Cloração
- `GET /api/calculos/:cpf` - Listar cálculos
- `POST /api/calculo` - Salvar cálculo

### Selos
- `GET /api/selo/:cpf` - Buscar selo ativo
- `POST /api/selo` - Emitir selo

### Requisitos de Selos
- `GET /api/requisitos/:cpf` - Listar requisitos
- `POST /api/requisito` - Atualizar requisito

### Estatísticas
- `GET /api/estatisticas/:cpf` - Estatísticas gerais

---

## 🐛 Solução de Problemas

### Erro: "Connection refused" ou "ECONNREFUSED"

**Problema:** O servidor backend não está rodando.

**Solução:**
```bash
cd server
npm run dev
```

### Erro: "password authentication failed"

**Problema:** Senha incorreta no arquivo `.env`.

**Solução:**
1. Abra `server/.env`
2. Corrija a senha do PostgreSQL
3. Reinicie o servidor

### Erro: "relation does not exist"

**Problema:** As tabelas não foram criadas no banco.

**Solução:**
```bash
psql -U postgres -d acaiseguro -f sql/schema.sql
```

### Erro: "Port 3000 already in use"

**Problema:** A porta 3000 já está sendo usada.

**Solução 1:** Mude a porta no arquivo `.env`:
```env
PORT=3001
```

**Solução 2:** Encerre o processo que está usando a porta 3000.

### Frontend não conecta à API

**Problema:** CORS ou API offline.

**Solução:**
1. Verifique se o servidor está rodando (`http://localhost:3000`)
2. O frontend funcionará com cache local se a API estiver offline
3. Verifique o console do navegador (F12) para erros

---

## 🔒 Segurança

### Desenvolvimento Local
- As credenciais estão no arquivo `.env`
- **NUNCA** comite o arquivo `.env` no Git
- O `.env.example` serve apenas como modelo

### Produção (quando for publicar)
- Use variáveis de ambiente do servidor
- Habilite HTTPS
- Configure CORS adequadamente
- Use autenticação JWT (já preparado no código)
- Fazer backup regular do banco de dados

---

## 🚀 Deploy (Opcional)

### Backend (Heroku, DigitalOcean, etc)
1. Configure as variáveis de ambiente no servidor
2. Instale as dependências: `npm install --production`
3. Inicie o servidor: `npm start`

### Frontend (GitHub Pages, Netlify, etc)
1. Atualize o `apiUrl` em `js/database.js` para a URL da API em produção
2. Faça upload dos arquivos HTML, CSS e JS

---

## 📊 Backup do Banco de Dados

### Fazer Backup
```bash
pg_dump -U postgres -d acaiseguro > backup_acaiseguro.sql
```

### Restaurar Backup
```bash
psql -U postgres -d acaiseguro < backup_acaiseguro.sql
```

---

## 📞 Suporte

Em caso de dúvidas:
1. Verifique os logs do servidor no terminal
2. Verifique o console do navegador (F12 > Console)
3. Consulte a documentação do PostgreSQL e Node.js

---

## ✅ Checklist de Instalação

- [ ] PostgreSQL instalado
- [ ] Node.js instalado
- [ ] Banco de dados `acaiseguro` criado
- [ ] Schema SQL executado (tabelas criadas)
- [ ] Dependências do servidor instaladas (`npm install`)
- [ ] Arquivo `.env` configurado com credenciais corretas
- [ ] Servidor backend rodando (`npm run dev`)
- [ ] API testada e funcionando (`http://localhost:3000`)
- [ ] Frontend aberto no navegador
- [ ] Cadastro realizado com sucesso

---

**Parabéns! 🎉 O sistema Açaí Seguro está configurado e pronto para uso!**
