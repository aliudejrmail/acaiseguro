# Guia de Implantação: Render + Neon PostgreSQL

Este guia explica passo a passo como colocar a aplicação **Açaí Seguro** no ar (em produção) utilizando o **Render** para a hospedagem do sistema e o **Neon** para o banco de dados. Ambas as plataformas oferecem planos gratuitos excelentes para testes e aplicações iniciais.

## 1. Banco de Dados (Neon)

O Neon é um serviço PostgreSQL "serverless" moderno.

1.  Acesse [neon.tech](https://neon.tech/) e crie uma conta (pode usar o Google ou GitHub).
2.  Crie um novo projeto (ex: `acai-seguro-db`).
3.  Na tela inicial do projeto (Dashboard), procure pela seção **Connection String**.
4.  Copie o link (URL). Ele deve parecer com isso: `postgresql://[usuario]:[senha]@[host-do-neon].neon.tech/neondb?sslmode=require`.
5.  **Dica Importante:** Mantenha essa Connection String em um local seguro, não a coloque diretamente no código!

### Inicializando o Banco de Dados no Neon

Como o Neon é um banco recém-criado, ele estará vazio. Você precisa executar os arquivos `.sql` nele.
Você pode usar a ferramenta **SQL Editor** disponível no painel do Neon, ou conectar-se via pgAdmin/DBeaver utilizando a Connection String.
1. Abra o arquivo `sql/schema.sql` local, copie seu conteúdo e rode no SQL Editor do Neon.
2. Faça o mesmo com `sql/gestor_schema.sql` para criar os dados de gestores.

## 2. Preparando seu Repositório (GitHub)

O Render conecta-se automaticamente ao seu GitHub para fazer o "deploy" (publicação).

1.  Se o seu código ainda não está no GitHub, crie um repositório e suba (faça o "push") do seu projeto atual.
2.  Garanta que o código principal esteja na branch `main` ou `master`.

## 3. Hospedagem (Render)

O Render hospedará o seu servidor NodeJS (`server.js`) que, além de servir a API, servirá também o site (frontend).

1.  Acesse [render.com](https://render.com/) e crie uma conta.
2.  No painel, clique em **New +** e selecione **Web Service**.
3.  Conecte a sua conta do GitHub e selecione o repositório do "Açaí Seguro".
4.  Na tela de configurações do Web Service:
    *   **Name:** `acai-seguro` (ou o que preferir).
    *   **Region:** A mais próxima (ex: US East).
    *   **Branch:** `main` (ou a que você usa).
    *   **Runtime:** `Node`.
    *   **Build Command:** `npm install` (isso instalará as dependências da pasta raiz, mas como seu `package.json` está na pasta `server`, o comando correto é `cd server && npm install`).
    *   **Start Command:** `cd server && node server.js`.
    *   **Instance Type:** Free (Gratuito).

### Configurando as Variáveis de Ambiente no Render

Ainda na tela de configuração (ou posteriormente na aba "Environment"), você **PRECISA** configurar as Variáveis de Ambiente (Environment Variables) para que seu sistema se comunique com o banco Neon de forma segura.

Role a página para baixo e clique em **Environment Variables** (ou acesse a aba caso o app já esteja criado) e adicione:

*   **Key:** `DATABASE_URL`
    *   **Value:** Cole a *Connection String completa* que você gerou no passo 1 do Neon.
*   **Key:** `PORT`
    *   **Value:** (pode deixar vazio ou colocar `3000`. O Render normalmente gerencia isso sozinho pela porta do ambiente, mas informar explicitamente previne erros).
*   **Key:** `NODE_ENV`
    *   **Value:** `production`

5.  Clique em **Create Web Service**.

## 4. O que Acontece Agora?

O Render vai começar a gerar a sua aplicação ("Building"). Você verá um terminal ("Logs") com os processos rodando.
Quando estiver concluído, aparecerá uma URL amigável no topo, no formato:
`https://[nome-do-seu-app].onrender.com`

Seu sistema de cadastro "Açaí Seguro", o painel do Gestor e a API estarão disponíveis e prontos para uso nessa URL de forma global, acessíveis do celular ou computador, ligados diretamente à nuvem do Neon!
