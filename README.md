# Açaí Seguro 🍇

## Sistema de Gestão de Qualidade Sanitária para Batedores de Açaí

### 📋 Sobre o Projeto

O **Açaí Seguro** é um aplicativo web desenvolvido para auxiliar e regularizar o trabalho dos batedores de açaí artesanal, com foco principal na **segurança alimentar** e **saúde pública**, especialmente na prevenção da doença de Chagas.

### 🎯 Objetivos

- Facilitar a vigilância em saúde e o controle do comércio local do produto
- Garantir que o município esteja seguro
- Reforçar as políticas de saúde coletiva em vigilância sanitária
- Credibilizar e fortalecer o comércio local

### ✨ Funcionalidades

#### 1. Módulo de Cadastro e Controle
- Cadastro completo do batedor (dados pessoais e do estabelecimento)
- Integração com geolocalização
- Registro de alvará sanitário

#### 2. Calculadora de Higienização (Cloração)
- Cálculo preciso da quantidade de hipoclorito de sódio necessária
- Suporte para diferentes concentrações de cloro (2%, 2.5%, 10%, 12%)
- Instruções detalhadas de uso

#### 3. Etapas do Processamento Correto
- Guia passo a passo interativo com 8 etapas:
  1. Recebimento
  2. Seleção/Catação
  3. Lavagem prévia
  4. Desinfecção (cloração) - **ETAPA CRÍTICA**
  5. Enxágue
  6. Branqueamento (choque térmico) - **ETAPA CRÍTICA**
  7. Despolpamento
  8. Envase
- Destaque para etapas críticas de segurança
- Cronômetro integrado para branqueamento (10 segundos a 80°C)

#### 4. Galeria de Equipamentos e Utensílios
- Lista completa de equipamentos necessários
- EPIs obrigatórios
- Especificações técnicas

#### 5. Check-list de Boas Práticas de Fabricação (BPF)
- Formulário interativo diário
- 5 categorias de verificação:
  - Higiene do manipulador
  - Limpeza do ambiente
  - Controle de pragas
  - Qualidade da água
  - Manutenção dos equipamentos
- Histórico de conformidade
- Cálculo automático de percentual de adequação

#### 6. Sistema de Certificação (Selos)

##### Selo Prata (Certificação Básica)
Requisitos:
- Cadastro completo no sistema
- Alvará sanitário vigente
- Espaço adequado (separado e identificado)
- Check-list BPF preenchido por 7 dias consecutivos

##### Selo Ouro (Certificação Avançada)
Requisitos:
- Possui Selo Prata vigente
- Equipamentos adequados
- Processamento correto em todas as etapas
- Check-list BPF preenchido por 30 dias consecutivos
- Análise da água realizada (últimos 6 meses)
- Planilhas de registro de produtos
- Gestão adequada de resíduos
- Documentação vigente e organizada

**Validade:** 1 ano para ambos os selos

### 🛠️ Tecnologias Utilizadas

#### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo e moderno
- **JavaScript (ES6+)** - Lógica do aplicativo
- **Font Awesome** - Ícones
- **Geolocation API** - Localização do estabelecimento

#### Backend
- **Node.js** - Ambiente de execução JavaScript
- **Express.js** - Framework web para Node.js
- **PostgreSQL** - Banco de dados relacional
- **pg** - Driver PostgreSQL para Node.js
- **CORS** - Suporte para requisições cross-origin

#### Armazenamento
- **PostgreSQL Database** - Armazenamento persistente principal
- **LocalStorage** - Cache local para modo offline

### 📁 Estrutura do Projeto

```
vig_bat_acai/
│
├── index.html              # Página principal (Frontend)
│
├── css/
│   └── styles.css          # Estilos completos
│
├── js/
│   ├── database.js         # Camada de comunicação com API
│   └── app.js              # Lógica principal do frontend
│
├── server/                 # Backend Node.js + Express
│   ├── server.js           # Servidor principal
│   ├── package.json        # Dependências Node.js
#### Instalação Rápida (Windows)

1. **Execute o instalador:**
   ```bash
   install.bat
   ```

2. **Configure o banco de dados:**
   ```bash
   setup-database.bat
   ```

3. **Inicie o servidor:**
   ```bash
   start-server.bat
   ```

4. **Abra o aplicativo:**
   - Abra `index.html` no navegador
   - Ou acesse: `http://localhost/vig_bat_acai`

#### Instalação Completa

Para instruções detalhadas, consulte: **[SETUP.md](SETUP.md)**

#### Primeiro Uso

1. Complete seu cadastro no módulo "Cadastro"
2. O CPF será seu identificador único no sistema
3. Explore as funcionalidades do aplicativo
4. Comece a preencher o check-list diariamente
5.
├── SETUP.md                # Guia detalhado de instalação
└── README.md               # Documentação principal
```

### 🚀 Como Usar

1. **Instalação:**
   - Clone ou extraia os arquivos para um diretório
   - Não requer instalação de dependências

2. **Execução:**
   - Abra o arquivo `index.html` em qualquer navegador moderno
   - Recomendado: Chrome, Firefox, Edge ou Safari

3. **Primeiro Uso:**
   - Complete seu cadastro no módulo "Cadastro"
   - Explore as funcionalidades do aplicativo
   - Comece a preencher o check-list diariamente
   - Trabalhe para obter sua certificação

### 📱 Design Responsivo

O aplicativo é totalmente responsivo e funciona perfeitamente em:
- 💻 Desktops
- 📱 Tablets
- 📱 Smartphones

### 🎨 Interface Amigável

- Design simples e intuitivo
- Linguagem clara e acessível
- Foco em usuários com baixo letramento digital
- Ícones visuais para facilitar navegação
- Cores e destaques para alertas críticos

### ⚠️ Etapas Críticas de Segurança

#### Cloração (Desinfecção)
- Concentração: 100-200 ppm de cloro livre
- Tempo: 15 minutos de imersão completa

#### Branqueamento (Choque Térmico)
- Temperatura: 80°C
- Tempo: exatos 10 segundos
- **ESSENCIAL** para inativar o protozoário causador da doença de Chagas

### 🏆 Incentivos para Batedores Certificados

- Programas de financiamento para equipamentos
- Descontos em produtos de higienização
- Assistência técnica gratuita da vigilância sanitária
- Prioridade em editais governamentais
- Divulgação oficial como estabelecimento certificado

### 💾 Armazenamento de Dados

O sistema utiliza uma **arquitetura híbrida**:

#### Banco de Dados PostgreSQL (Principal)
- Armazenamento persistente e centralizado
- 5 tabelas principais:
  - `batedores` - Cadastros completos
  - `checklists` - Histórico de BPF
  - `calculos_cloracao` - Registros de cálculos
  - `selos` - Certificações emitidas
  - `requisitos_selos` - Progresso dos requisitos
- Views para estatísticas e relatórios
- Triggers automáticos para atualização de timestamps

#### LocalStorage (Cache)
- Cache local para funcionamento offline
- Fallback quando a API estiver indisponível
- Sincronização automática quando a conexão é restabelecida

#### API REST
- Interface entre frontend e banco de dados
- Endpoints RESTful padronizados
- Suporte a CORS para acesso cross-origin
- Tratamento de erros robusto

### 🔒 Privacidade

- Dados armazenados de forma segura no PostgreSQL
- Autenticação via CPF (identificador único)
- Cache local para funcionalidade offline
- Configuração de CORS adequada para segurança
- Preparado para autenticação JWT em produção

### 🌐 Arquitetura do Sistema

```
┌─────────────────┐
│   FRONTEND      │
│   (HTML/CSS/JS) │
│   index.html    │
└────────┬────────┘
         │ HTTP/AJAX
         │
┌────────▼────────┐
│   API REST      │
│   (Express.js)  │
│   Port 3000     │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   POSTGRESQL    │
│   (Database)    │
│   acaiseguro    │
└─────────────────┘
```

### 📡 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/batedor/:cpf` | Buscar cadastro |
| POST | `/api/batedor` | Criar/atualizar cadastro |
| GET | `/api/checklists/:cpf` | Listar check-lists |
| POST | `/api/checklist` | Salvar check-list |
| GET | `/api/calculos/:cpf` | Listar cálculos |
| POST | `/api/calculo` | Salvar cálculo |
| GET | `/api/selo/:cpf` | Buscar selo ativo |
| POST | `/api/selo` | Emitir selo |
| GET | `/api/requisitos/:cpf` | Listar requisitos |
| POST | `/api/requisito` | Atualizar requisito |
| GET | `/api/estatisticas/:cpf` | Estatísticas gerais |

### 📊 Conformidade Regulatória

O aplicativo segue as diretrizes de:
- ANVISA (Agência Nacional de Vigilância Sanitária)
- Decretos estaduais sobre processamento de açaí
- Boas Práticas de Fabricação (BPF)
- Normas de vigilância sanitária municipal

### 🔄 Atualizações Futuras (Sugeridas)

- [x] Integração com banco de dados PostgreSQL
- [x] API REST para comunicação cliente-servidor
- [x] Sistema de cache local (modo offline)
- [ ] Painel administrativo para vigilância sanitária
- [ ] Sistema de notificações push
- [ ] Exportação de relatórios em PDF
- [ ] Dashboard com gráficos e estatísticas
- [ ] Sistema de chat/suporte técnico
- [ ] Versão mobile nativa (iOS/Android)
- [ ] Integração com sistemas governamentais
- [ ] Galeria de fotos do estabelecimento
- [ ] Autenticação JWT completa
- [ ] Sistema de backup automático
- [ ] Geração de QR Code do selo

### 👥 Público-Alvo

- Batedores de açaí artesanal
- Microempreendedores do setor alimentício
- Vigilância sanitária municipal
- Secretarias de saúde

### 📞 Suporte

Para suporte técnico ou dúvidas sobre uso do aplicativo, consulte a vigilância sanitária do seu município.

### 📜 Licença

Este projeto foi desenvolvido para fins de saúde pública e segurança alimentar.

### 🙏 Agradecimentos

Desenvolvido com o objetivo de promover a segurança alimentar e proteger a saúde pública, especialmente no combate à doença de Chagas transmitida pelo açaí contaminado.

---

**Açaí Seguro** - Qualidade, Segurança e Saúde para Todos! 🍇✨
