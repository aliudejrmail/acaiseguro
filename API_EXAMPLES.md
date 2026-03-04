# 📚 Exemplos de Uso da API - Açaí Seguro

Este arquivo contém exemplos práticos de como usar a API REST do sistema.

---

## 🔌 Configuração Base

**URL Base:** `http://localhost:3000/api`  
**Content-Type:** `application/json`

---

## 1️⃣ CADASTRO DE BATEDOR

### Criar/Atualizar Cadastro

**Endpoint:** `POST /api/batedor`

**Body:**
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "telefone": "(91) 98765-4321",
  "nomeFantasia": "Açaí do João",
  "cnpj": "12.345.678/0001-00",
  "endereco": "Rua das Palmeiras, 123, Centro",
  "alvara": "ALV-2026-001",
  "latitude": -1.4558,
  "longitude": -48.4902
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "telefone": "(91) 98765-4321",
    "nome_fantasia": "Açaí do João",
    "cnpj": "12.345.678/0001-00",
    "endereco": "Rua das Palmeiras, 123, Centro",
    "alvara": "ALV-2026-001",
    "latitude": -1.4558,
    "longitude": -48.4902,
    "data_cadastro": "2026-03-03T10:30:00.000Z",
    "data_atualizacao": "2026-03-03T10:30:00.000Z"
  }
}
```

### Buscar Cadastro

**Endpoint:** `GET /api/batedor/:cpf`

**Exemplo:** `GET /api/batedor/123.456.789-00`

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    ...
  }
}
```

---

## 2️⃣ CHECK-LISTS

### Salvar Check-list

**Endpoint:** `POST /api/checklist`

**Body:**
```json
{
  "cpf": "123.456.789-00",
  "higiene": ["1", "2", "3", "4", "5"],
  "ambiente": ["1", "2", "3", "4", "5", "6"],
  "pragas": ["1", "2", "3", "4"],
  "agua": ["1", "2", "3"],
  "equipamentos": ["1", "2", "3", "4"],
  "observacoes": "Tudo conforme. Equipamento novo instalado.",
  "itensConformes": 22,
  "totalItens": 22,
  "percentualConformidade": 100,
  "conforme": true
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batedor_id": 1,
    "data_checklist": "2026-03-03T14:00:00.000Z",
    "higiene_manipulador": ["1", "2", "3", "4", "5"],
    "limpeza_ambiente": ["1", "2", "3", "4", "5", "6"],
    "controle_pragas": ["1", "2", "3", "4"],
    "qualidade_agua": ["1", "2", "3"],
    "manutencao_equipamentos": ["1", "2", "3", "4"],
    "observacoes": "Tudo conforme. Equipamento novo instalado.",
    "itens_conformes": 22,
    "total_itens": 22,
    "percentual_conformidade": 100.00,
    "conforme": true,
    "criado_em": "2026-03-03T14:00:00.000Z"
  }
}
```

### Listar Check-lists

**Endpoint:** `GET /api/checklists/:cpf?dias=30`

**Exemplo:** `GET /api/checklists/123.456.789-00?dias=7`

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "data_checklist": "2026-03-03T14:00:00.000Z",
      "percentual_conformidade": 100.00,
      "conforme": true
    },
    {
      "id": 2,
      "data_checklist": "2026-03-02T14:00:00.000Z",
      "percentual_conformidade": 95.45,
      "conforme": true
    },
    {
      "id": 1,
      "data_checklist": "2026-03-01T14:00:00.000Z",
      "percentual_conformidade": 90.91,
      "conforme": true
    }
  ]
}
```

---

## 3️⃣ CÁLCULOS DE CLORAÇÃO

### Salvar Cálculo

**Endpoint:** `POST /api/calculo`

**Body:**
```json
{
  "cpf": "123.456.789-00",
  "quantidadeAgua": 100,
  "concentracaoCloro": 2.5,
  "resultado": 6.0
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batedor_id": 1,
    "data_calculo": "2026-03-03T15:30:00.000Z",
    "quantidade_agua": 100.00,
    "concentracao_cloro": 2.50,
    "resultado_ml": 6.00
  }
}
```

### Listar Cálculos

**Endpoint:** `GET /api/calculos/:cpf`

**Exemplo:** `GET /api/calculos/123.456.789-00`

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "data_calculo": "2026-03-03T15:30:00.000Z",
      "quantidade_agua": 100.00,
      "concentracao_cloro": 2.50,
      "resultado_ml": 6.00
    },
    {
      "id": 2,
      "data_calculo": "2026-03-02T10:15:00.000Z",
      "quantidade_agua": 50.00,
      "concentracao_cloro": 2.0,
      "resultado_ml": 3.75
    }
  ]
}
```

---

## 4️⃣ SELOS

### Emitir Selo

**Endpoint:** `POST /api/selo`

**Body:**
```json
{
  "cpf": "123.456.789-00",
  "tipo": "prata"
}
```

**Tipos válidos:** `"prata"` ou `"ouro"`

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batedor_id": 1,
    "tipo": "prata",
    "data_emissao": "2026-03-03T16:00:00.000Z",
    "data_validade": "2027-03-03T16:00:00.000Z",
    "ativo": true,
    "criado_em": "2026-03-03T16:00:00.000Z"
  }
}
```

### Buscar Selo Ativo

**Endpoint:** `GET /api/selo/:cpf`

**Exemplo:** `GET /api/selo/123.456.789-00`

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batedor_id": 1,
    "tipo": "prata",
    "data_emissao": "2026-03-03T16:00:00.000Z",
    "data_validade": "2027-03-03T16:00:00.000Z",
    "ativo": true
  }
}
```

**Se não houver selo:**
```json
{
  "success": true,
  "data": null
}
```

---

## 5️⃣ REQUISITOS DE SELOS

### Atualizar Requisito

**Endpoint:** `POST /api/requisito`

**Body:**
```json
{
  "cpf": "123.456.789-00",
  "tipoSelo": "prata",
  "numeroRequisito": 1,
  "status": true
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batedor_id": 1,
    "tipo_selo": "prata",
    "numero_requisito": 1,
    "status": true,
    "data_atualizacao": "2026-03-03T16:30:00.000Z"
  }
}
```

### Listar Requisitos

**Endpoint:** `GET /api/requisitos/:cpf`

**Exemplo:** `GET /api/requisitos/123.456.789-00`

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo_selo": "prata",
      "numero_requisito": 1,
      "status": true,
      "data_atualizacao": "2026-03-03T16:30:00.000Z"
    },
    {
      "id": 2,
      "tipo_selo": "prata",
      "numero_requisito": 2,
      "status": true,
      "data_atualizacao": "2026-03-03T16:30:00.000Z"
    }
  ]
}
```

---

## 6️⃣ ESTATÍSTICAS

### Obter Estatísticas

**Endpoint:** `GET /api/estatisticas/:cpf`

**Exemplo:** `GET /api/estatisticas/123.456.789-00`

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalChecklists": 45,
    "mediaConformidade": "96.20",
    "checklists30dias": 30
  }
}
```

---

## ❌ TRATAMENTO DE ERROS

### Erro 404 - Não Encontrado

**Exemplo:** Buscar batedor que não existe

```json
{
  "error": "Batedor não encontrado"
}
```

### Erro 400 - Requisição Inválida

**Exemplo:** Campos obrigatórios faltando

```json
{
  "error": "Campos obrigatórios faltando"
}
```

### Erro 500 - Erro Interno

```json
{
  "error": "Erro interno do servidor"
}
```

---

## 🧪 TESTANDO COM CURL

### Windows PowerShell:

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3000" -Method Get

# Criar batedor
$body = @{
    nome = "João Silva"
    cpf = "123.456.789-00"
    telefone = "(91) 98765-4321"
    nomeFantasia = "Açaí do João"
    endereco = "Rua das Palmeiras, 123"
    alvara = "ALV-2026-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/batedor" -Method Post -Body $body -ContentType "application/json"

# Buscar batedor
Invoke-RestMethod -Uri "http://localhost:3000/api/batedor/123.456.789-00" -Method Get
```

### Linux/Mac (curl):

```bash
# Health Check
curl http://localhost:3000

# Criar batedor
curl -X POST http://localhost:3000/api/batedor \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "telefone": "(91) 98765-4321",
    "nomeFantasia": "Açaí do João",
    "endereco": "Rua das Palmeiras, 123",
    "alvara": "ALV-2026-001"
  }'

# Buscar batedor
curl http://localhost:3000/api/batedor/123.456.789-00
```

---

## 🔧 TESTANDO COM POSTMAN

1. Importe a coleção de exemplos (criar arquivo JSON)
2. Configure a base URL: `http://localhost:3000`
3. Use os exemplos acima como guia

---

## 📊 QUERIES SQL ÚTEIS

### Ver todos os batedores:
```sql
SELECT * FROM batedores;
```

### Batedores com selos ativos:
```sql
SELECT * FROM v_batedores_com_selo;
```

### Estatísticas de conformidade:
```sql
SELECT * FROM v_estatisticas_conformidade;
```

### Check-lists dos últimos 7 dias:
```sql
SELECT * FROM checklists 
WHERE data_checklist >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY data_checklist DESC;
```

### Progresso para selos:
```sql
SELECT * FROM v_progresso_selos WHERE batedor_id = 1;
```

---

**📚 Para mais informações, consulte:**
- [SETUP.md](SETUP.md) - Guia de instalação
- [README.md](README.md) - Documentação completa
- [INTEGRACAO_COMPLETA.md](INTEGRACAO_COMPLETA.md) - Resumo da integração
