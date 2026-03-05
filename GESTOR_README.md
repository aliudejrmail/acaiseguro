# Sistema de Gestor - Açaí Seguro

## 📋 Visão Geral

O sistema de gestor permite que autoridades sanitárias possam:

- **Visualizar** todos os estabelecimentos cadastrados
- **Analisar** check-lists e documentação
- **Aprovar ou Reprovar** estabelecimentos
- **Criar laudos** detalhados com pontos críticos e positivos
- **Editar check-lists** quando necessário
- **Acompanhar histórico** de todas as ações
- **Enviar notificações** para os batedores

---

## 🚀 Instalação

### Pré-requisitos

- PostgreSQL instalado e rodando
- Node.js instalado
- Sistema Açaí Seguro base já configurado

### Passo 1: Aplicar alterações no banco de dados

Execute o script batch:

```batch
aplicar-gestor.bat
```

Este script irá:
- Adicionar campo `role` na tabela `usuarios`
- Criar tabelas `analises`, `historico_gestor` e `notificacoes`
- Adicionar campos de aprovação na tabela `batedores`
- Criar views para o dashboard
- Criar usuário gestor padrão

### Passo 2: Iniciar o servidor

```batch
start-server.bat
```

Ou manualmente:

```bash
cd server
node server.js
```

### Passo 3: Acessar o painel do gestor

1. Abra o navegador em: `http://localhost:3000`
2. Selecione **"Gestor / Autoridade Sanitária"**
3. Use as credenciais padrão:
   - **Email**: `gestor@acaiseguro.com`
   - **Senha**: `gestor123`

---

## 🎯 Funcionalidades

### Dashboard

O dashboard exibe estatísticas em tempo real:

- Total de estabelecimentos cadastrados
- Quantos estão aprovados
- Quantos aguardam análise
- Quantos estão em análise
- Quantos foram reprovados

### Listagem de Estabelecimentos

- **Filtros**: Por status, nome, CPF
- **Ordenação**: Por data, nome, conformidade
- **Busca rápida**: Busca em tempo real
- **Visualização**: Conformidade média, número de check-lists, selos ativos

### Detalhes do Estabelecimento

#### Aba Informações
- Dados completos do estabelecimento
- Status atual de aprovação
- Botões para alterar status rapidamente

#### Aba Check-lists
- Histórico completo de check-lists
- Visualização detalhada por categoria
- Percentual de conformidade
- Opção de editar check-list (em desenvolvimento)

#### Aba Análises
- Histórico de todas as análises realizadas
- Laudos detalhados
- Pontos críticos identificados
- Pontos positivos destacados
- Prazos para correções
- Pontuações atribuídas

#### Aba Nova Análise
Formulário completo para criar análise:

- **Tipo de Análise**: Inicial, Renovação, Fiscalização ou Reclamação
- **Resultado**: Aprovado, Reprovado ou Pendente Correções
- **Pontuação**: De 0 a 100
- **Laudo Detalhado**: Campo de texto livre
- **Pontos Críticos**: Lista de problemas encontrados
- **Pontos Positivos**: Lista de boas práticas identificadas
- **Prazo para Correções**: Data limite para adequações

### Alteração de Status

Os estabelecimentos podem ter os seguintes status:

- **Pendente**: Aguardando primeira análise
- **Em Análise**: Atualmente sendo avaliado
- **Aprovado**: Atende todos os requisitos
- **Reprovado**: Não atende aos requisitos mínimos

### Notificações Automáticas

Quando o gestor realiza uma ação, o batedor recebe uma notificação automática:

- ✅ Estabelecimento aprovado
- ❌ Estabelecimento reprovado
- ⚠️ Pendências identificadas
- 🔍 Status alterado

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `usuarios`
- Campo `role` adicionado: `'batedor'` ou `'gestor'`

### Nova Tabela: `analises`
Armazena laudos e análises realizadas pelos gestores:
- `id`: Identificador único
- `batedor_id`: Referência ao estabelecimento
- `gestor_id`: Gestor responsável
- `tipo_analise`: Tipo da análise
- `resultado`: Aprovado, Reprovado ou Pendente
- `pontuacao`: Pontuação de 0 a 100
- `pontos_criticos`: Array de problemas
- `pontos_positivos`: Array de pontos fortes
- `laudo`: Texto completo do laudo
- `prazo_correcao`: Data limite para correções
- `anexos`: Fotos e documentos (JSONB)

### Nova Tabela: `historico_gestor`
Registra todas as ações dos gestores (auditoria):
- `id`: Identificador único
- `gestor_id`: Quem realizou a ação
- `batedor_id`: Estabelecimento afetado
- `acao`: Tipo de ação realizada
- `detalhes`: Informações adicionais (JSONB)
- `data_acao`: Timestamp da ação

### Nova Tabela: `notificacoes`
Notificações enviadas aos batedores:
- `id`: Identificador único
- `batedor_id`: Estabelecimento
- `usuario_id`: Usuário a ser notificado
- `tipo`: Tipo de notificação
- `titulo`: Título da notificação
- `mensagem`: Conteúdo da mensagem
- `lida`: Boolean indicando se foi lida

### Views Criadas

#### `v_dashboard_gestor`
Estatísticas gerais para o dashboard

#### `v_batedores_resumo`
Lista resumida de batedores com informações relevantes

---

## 🔐 Segurança

### Autenticação

- Sistema de roles (batedor/gestor)
- Validação de permissões em cada rota
- Middleware de verificação de gestor

### Auditoria

- Todas as ações são registradas na tabela `historico_gestor`
- Timestamps de criação e atualização
- Rastreabilidade completa de alterações

### Notificações

- Sistema automático de notificações
- Alertas sobre mudanças de status
- Comunicação transparente com batedores

---

## 📡 API Endpoints

### Dashboard
```
GET /api/gestor/dashboard
```
Retorna estatísticas gerais e análises recentes

### Listagem de Batedores
```
GET /api/gestor/batedores?status=&busca=&ordenar=
```
Lista todos os batedores com filtros

### Detalhes do Batedor
```
GET /api/gestor/batedor/:id
```
Retorna dados completos, checklists, análises, selos

### Criar Análise
```
POST /api/gestor/analise
Body: {
  gestorId, batedorId, tipoAnalise, resultado,
  pontuacao, pontosCriticos[], pontosPositivos[],
  laudo, prazoCorrecao
}
```

### Atualizar Análise
```
PUT /api/gestor/analise/:id
```

### Editar Checklist
```
PUT /api/gestor/checklist/:id
```

### Alterar Status
```
PUT /api/gestor/batedor/:id/status
Body: { gestorId, status, motivoReprovacao }
```

### Histórico de Ações
```
GET /api/gestor/historico?gestorId=&batedorId=&limite=
```

### Notificações
```
GET /api/gestor/notificacoes/:usuarioId?apenasNaoLidas=
PUT /api/gestor/notificacao/:id/lida
```

### Relatórios
```
GET /api/gestor/relatorio/conformidade?dataInicio=&dataFim=
```

---

### Administração de Usuários
As gestors agora podem gerenciar contas diretamente pelo painel.

```
GET /api/gestor/usuarios?role=&busca=
```
Lista de usuários; opção de filtrar por `role` ("gestor" ou "batedor") e busca por nome/email.

```
GET /api/gestor/usuario/:id
```
Detalhes de um usuário.

```
POST /api/gestor/usuario
Body: { nome, email, senha, role }
```
Cria um novo usuário com função especificada.

```
PUT /api/gestor/usuario/:id
Body: { nome?, email?, role?, senha? }
```
Atualiza campos do usuário; a senha passada será criptografada.

```
DELETE /api/gestor/usuario/:id
```
Remove usuário da base.


---

## 🎨 Interface

### Design
- **Cores principais**: Gradiente roxo (#7828c8 - #9333ea)
- **Glassmorphism**: Efeitos de vidro translúcido
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Animações**: Transições suaves e feedback visual

### Componentes

#### Dashboard Cards
Cards coloridos com ícones para cada métrica

#### Tabela de Batedores
Tabela completa com badges de status e botões de ação

#### Modal de Detalhes
Modal expansivo com sistema de tabs

#### Formulários
Formulários com validação e feedback visual

---

## 🔧 Customização

### Adicionar Novo Gestor

Execute SQL manualmente:

```sql
INSERT INTO usuarios (nome, email, senha, role)
VALUES ('Nome do Gestor', 'email@exemplo.com', '$2a$10$hash_bcrypt', 'gestor');
```

Ou crie um endpoint de cadastro de gestor.

### Modificar Permissões

Edite o middleware `verificarGestor` em `/server/routes/gestor.js`

### Adicionar Novos Tipos de Análise

Modifique o enum no banco:

```sql
ALTER TYPE tipo_analise ADD VALUE 'novo_tipo';
```

E atualize o formulário em `gestor.html`

---

## 📱 Responsividade

O painel é totalmente responsivo:

- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Adaptação de grid e tabelas
- **Mobile**: Layout vertical, scroll horizontal em tabelas

---

## 🐛 Troubleshooting

### Erro ao aplicar schema

**Problema**: `ERROR: relation "usuarios" does not exist`

**Solução**: Execute primeiro o schema base:
```batch
setup-database.bat
```

### Gestor não consegue fazer login

**Problema**: "Este usuário não possui permissão de gestor"

**Solução**: Verifique a role no banco:
```sql
SELECT id, nome, email, role FROM usuarios WHERE email = 'gestor@acaiseguro.com';
```

Se necessário, atualize:
```sql
UPDATE usuarios SET role = 'gestor' WHERE email = 'gestor@acaiseguro.com';
```

### Modal não abre

**Problema**: Erro no console do navegador

**Solução**: 
1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Verifique se o servidor está rodando
3. Verifique erros no console (F12)

---

## 📈 Próximos Passos

### Funcionalidades Futuras

- [ ] Edição completa de checklists pelo gestor
- [ ] Upload de fotos/documentos nas análises
- [ ] Geração de relatórios em PDF
- [ ] Exportação de dados em Excel
- [ ] Dashboard com gráficos interativos
- [ ] Sistema de mensagens entre gestor e batedor
- [ ] Agendamento de fiscalizações
- [ ] Histórico de localizações GPS
- [ ] Integração com e-mail para notificações
- [ ] App mobile para gestores

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este README
2. Consulte os logs do servidor
3. Verifique o console do navegador (F12)
4. Revise o código-fonte comentado

---

## 📄 Licença

Sistema desenvolvido para gestão sanitária de batedores de açaí.

---

## 🙏 Créditos

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla
- **Ícones**: Font Awesome 6.4.0
- **Design**: Gradientes roxos e glassmorphism

---

**Versão**: 1.0.0  
**Data**: Março 2026  
**Status**: ✅ Produção
