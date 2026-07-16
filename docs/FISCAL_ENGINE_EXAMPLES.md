# Exemplos de Uso - Tavolo Fiscal Engine

## 1️⃣ Configuração Inicial

### Registrar Configurações Fiscais do Estabelecimento

```bash
curl -X POST http://localhost:3333/api/fiscal/config \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -H "Content-Type: application/json" \
  -d '{
    "certificate_path": "/secure/storage/empresa-123.pfx",
    "certificate_password": "sua-senha-certificado",
    "csc_token": "06224979006117000100650010000000000000000000",
    "csc_id": "16",
    "is_homologation": false
  }'
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "config": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "establishment_id": "e3b0c44298fc1c14-establishment-id",
    "certificate_path": "/secure/storage/empresa-123.pfx",
    "csc_id": "16",
    "is_homologation": false,
    "next_nfe_number": 1,
    "created_at": "2024-12-19T10:30:00.000Z",
    "updated_at": "2024-12-19T10:30:00.000Z"
  },
  "message": "Configuração fiscal salva com sucesso"
}
```

### Obter Configuração Atual

```bash
curl -X GET http://localhost:3333/api/fiscal/config \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..."
```

---

## 2️⃣ Emissão de NFC-e (UC21)

### Emitir NFC-e para uma Venda

Após o cliente finalizar o pagamento no Self-Ordering:

```bash
curl -X POST http://localhost:3333/api/fiscal/emit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -H "Content-Type: application/json" \
  -d '{
    "venda_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "fiscal_note": {
    "id": "d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g",
    "venda_id": "550e8400-e29b-41d4-a716-446655440000",
    "fiscal_config_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "AUTHORIZED",
    "access_key": "06224979006117000100650010000000000000000001",
    "protocol_number": "105240000000001",
    "xml_content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><NFe>...</NFe>",
    "danfe_url": "https://s3.amazonaws.com/tavolo-danfe/nfe-001.pdf",
    "error_log": null,
    "created_at": "2024-12-19T10:35:22.000Z",
    "updated_at": "2024-12-19T10:35:22.000Z"
  },
  "message": "NFC-e emitida com sucesso"
}
```

**QR Code exibido no Self-Ordering**:

```
Chave de Acesso: 06224979006117000100650010000000000000000001
Protocolo: 105240000000001
URL QR Code: https://www.sefaz.rs.gov.br/NFCE/QRCODE?chNFe=06224979006117000100650010000000000000000001&tpAmb=1
```

---

## 3️⃣ Gestão de Notas Fiscais

### Listar Notas com Filtros Avançados

```bash
# Todas as notas autorizadas do período
curl -X GET 'http://localhost:3333/api/fiscal/notes?page=1&limit=20&status=AUTHORIZED' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..."

# Notas com filtro de período e valor
curl -X GET 'http://localhost:3333/api/fiscal/notes' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -G \
  --data-urlencode 'start_date=2024-12-01' \
  --data-urlencode 'end_date=2024-12-31' \
  --data-urlencode 'status=AUTHORIZED' \
  --data-urlencode 'min_value=0' \
  --data-urlencode 'max_value=10000'
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "data": {
    "meta": {
      "total": 150,
      "per_page": 20,
      "current_page": 1,
      "last_page": 8,
      "first_page": 1,
      "first_page_url": "/api/fiscal/notes?page=1",
      "last_page_url": "/api/fiscal/notes?page=8",
      "next_page_url": "/api/fiscal/notes?page=2",
      "prev_page_url": null
    },
    "data": [
      {
        "id": "d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g",
        "venda_id": "550e8400-e29b-41d4-a716-446655440000",
        "status": "AUTHORIZED",
        "access_key": "06224979006117000100650010000000000000000001",
        "protocol_number": "105240000000001",
        "created_at": "2024-12-19T10:35:22.000Z"
      },
      {
        "id": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
        "venda_id": "660e8400-e29b-41d4-a716-446655440001",
        "status": "AUTHORIZED",
        "access_key": "06224979006117000100650010000000000000000002",
        "protocol_number": "105240000000002",
        "created_at": "2024-12-19T10:40:15.000Z"
      }
    ]
  }
}
```

### Consultar Status de uma NFC-e

```bash
curl -X GET 'http://localhost:3333/api/fiscal/status/d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..."
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "current_status": "AUTHORIZED",
  "sefaz_status": {
    "status": 100,
    "message": "Autorizado"
  }
}
```

---

## 4️⃣ Download de Documentos

### Download da DANFE (PDF)

```bash
curl -X GET 'http://localhost:3333/api/fiscal/danfe/d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  --output danfe.pdf
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "danfe_url": "https://s3.amazonaws.com/tavolo-danfe/nfe-001.pdf",
  "access_key": "06224979006117000100650010000000000000000001"
}
```

### Download do XML

```bash
curl -X GET 'http://localhost:3333/api/fiscal/xml/d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  --output nfe.xml
```

---

## 5️⃣ Cancelamento de NFC-e

### Cancelar uma Nota Autorizada

> Requisito: justificativa entre 15 e 255 caracteres.

```bash
curl -X POST 'http://localhost:3333/api/fiscal/cancel/d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -H "Content-Type: application/json" \
  -d '{
    "justification": "Cancelamento de venda - produto devolvido pelo cliente"
  }'
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "message": "NFC-e cancelada com sucesso"
}
```

**Possíveis erros**:

❌ Status 400 - Nota não está autorizada:

```json
{
  "error": "Apenas notas autorizadas podem ser canceladas",
  "current_status": "PENDING"
}
```

---

## 6️⃣ Exportação para Contabilidade (UC23)

### Exportar Notas Fiscais do Período

```bash
curl -X GET 'http://localhost:3333/api/fiscal/export-accounting?month=12&year=2024' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  --output fiscal_12_2024.zip
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "message": "45 notas fiscais exportadas",
  "notes": [
    {
      "id": "d9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4g",
      "access_key": "06224979006117000100650010000000000000000001",
      "protocol_number": "105240000000001",
      "created_at": "2024-12-19T10:35:22.000Z"
    },
    {
      "id": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
      "access_key": "06224979006117000100650010000000000000000002",
      "protocol_number": "105240000000002",
      "created_at": "2024-12-19T10:40:15.000Z"
    }
  ]
}
```

---

## 7️⃣ Contingência (UC22)

Quando a SEFAZ está indisponível, o sistema tenta automaticamente emitir em modo contingência:

```json
{
  "success": true,
  "fiscal_note": {
    "id": "c5d6e7f8-a9b0-1c2d-3e4f-5g6h7i8j9k0l",
    "venda_id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "CONTINGENCY",
    "xml_content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><NFe>...</NFe>",
    "access_key": null,
    "protocol_number": null,
    "message": "NFC-e emitida em modo contingência - agendada para retransmissão"
  }
}
```

**O que acontece depois**:

1. ✅ XML é armazenado no banco
2. ⏰ BullMQ agenda retransmissão automática (a cada 5 minutos)
3. 🔄 Quando SEFAZ voltar, nota é retransmitida
4. ✔️ Status é atualizado para AUTHORIZED com dados da SEFAZ

---

## 🔴 Tratamento de Erros Comuns

### Erro 401 - Não autenticado

```json
{
  "errors": [
    {
      "message": "Unauthorized access"
    }
  ]
}
```

**Solução**: Verificar se o token é válido e não expirou

### Erro 422 - Dados obrigatórios faltando

```json
{
  "error": "venda_id é obrigatório"
}
```

**Solução**: Enviar todos os campos obrigatórios no request

### Erro 500 - Certificado não carregado

```json
{
  "error": "Erro ao emitir NFC-e",
  "message": "Certificado inválido ou senha incorreta"
}
```

**Solução**: Verificar certificado e senha na configuração

### Erro 500 - Assinatura sem chave privada

```json
{
  "error": "Erro ao emitir NFC-e",
  "message": "Erro ao assinar XML: Private key is required to compute signature"
}
```

**Solução**: Confirmar que o PFX contem a chave privada e que o download do certificado (R2/local) nao esta vazio; reenvie o certificado e valide a senha.

### Erro de assinatura sem KeyInfo/X509Certificate

Se o log indicar ausencia de `<KeyInfo>` ou `<X509Certificate>`, verifique se o signer esta setando `publicCert` para gerar o bloco automaticamente.

### NFC-e fica pendente sem protocolo

Se a transmissao para SEFAZ travar antes do retorno, a nota pode ficar em `PENDING` sem chave/protocolo.
Use `FISCAL_SEFAZ_TIMEOUT_MS` para forcar timeout e registrar erro em vez de pendencia silenciosa.
Agora a chave de acesso e salva a partir do XML assinado para permitir consulta mesmo antes do protocolo.
Em novas emissoes, a `accessKey` passa a ser salva ja na criacao da nota pendente.

### Diagnostico rapido do certificado

```bash
node ace fiscal:cert:diagnose --establishment-id=1
```

```bash
node ace fiscal:cert:diagnose --certificate-path=/path/arquivo.pfx --certificate-password=senha
```

```bash
node scripts/fiscal_cert_diagnose.mjs --establishment-id=1
```

**Nota**: Esse script usa `DATABASE_URL`, `FISCAL_ENCRYPTION_KEY` e variaveis `R2_*` quando o certificado esta no R2.

### Consultar status pelo access key (banco)

```bash
node scripts/query_nfce_status.mjs --access-key=CHAVE_AQUI
```

**Nota**: Usa `DATABASE_URL` e retorna apenas o status salvo no banco.
**Resultado esperado**: `Private key PEM: ok` e `Certificate PEM: ok`. Se falhar, reenvie o PFX correto.

---

## 🧪 Teste Completo (JavaScript/Node.js)

```javascript
const axios = require('axios')

const API_URL = 'http://localhost:3333/api/fiscal'
const TOKEN = 'seu-token-jwt-aqui'

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

async function fiscalWorkflow() {
  try {
    // 1. Configurar
    console.log('1️⃣ Configurando parâmetros fiscais...')
    const config = await axios.post(
      `${API_URL}/config`,
      {
        certificate_path: '/certs/empresa.pfx',
        certificate_password: 'senha123',
        csc_token: 'token-sefaz',
        csc_id: '16',
        is_homologation: true,
      },
      { headers }
    )
    console.log('✅ Configurado:', config.data.config.id)

    // 2. Emitir
    console.log('\n2️⃣ Emitindo NFC-e...')
    const emission = await axios.post(
      `${API_URL}/emit`,
      { venda_id: '550e8400-e29b-41d4-a716-446655440000' },
      { headers }
    )
    const fiscalNoteId = emission.data.fiscal_note.id
    console.log('✅ Emitida:', emission.data.fiscal_note.access_key)

    // 3. Listar
    console.log('\n3️⃣ Listando notas...')
    const list = await axios.get(`${API_URL}/notes`, { headers })
    console.log(`✅ Total: ${list.data.data.meta.total} notas`)

    // 4. Consultar status
    console.log('\n4️⃣ Consultando status...')
    const status = await axios.get(`${API_URL}/status/${fiscalNoteId}`, { headers })
    console.log('✅ Status:', status.data.current_status)

    console.log('\n🎉 Workflow completo!')
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message)
  }
}

fiscalWorkflow()
```

---

## 📌 Notas Importantes

- ✅ Todas as rotas requerem autenticação
- ✅ Dados são isolados por `establishment_id` (multi-tenant)
- ✅ Senhas de certificados são criptografadas no banco
- ✅ Logs de todas as operações são mantidos para auditoria
- ✅ Respostas seguem padrão JSON REST

---

**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024
