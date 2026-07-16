# Tavolo Fiscal Engine - Guia Técnico de Implementação

## 📋 Visão Geral

Este documento descreve a implementação completa do **Tavolo Fiscal Engine**, um módulo nativo e independente para emissão, gestão e armazenamento de documentos fiscais eletrônicos (NFC-e e NF-e) integrado ao Tavolo com AdonisJS, TypeScript e PostgreSQL.

---

## 🏗️ Arquitetura Implementada

### 1. Estrutura de Camadas

```json
FiscalController (API Endpoints)
         ↓
   FiscalService (Orquestração)
         ↓
   ┌──────────────────────────────┐
   │   Service Layer Pattern      │
   ├──────────────────────────────┤
   │ - FiscalTransformer          │
   │ - FiscalSigner               │
   │ - FiscalTransmitter          │
   └──────────────────────────────┘
         ↓
   FiscalProvider (Gerenciamento de Certificados)
         ↓
   FiscalConfig & FiscalNote (Modelos/BD)
```

### 2. Banco de Dados (PostgreSQL)

#### Tabela: `fiscal_configs`

Armazena parâmetros por estabelecimento:

- **id** (UUID, PK)
- **establishment_id** (UUID, FK) - Relacionamento com empresa
- **certificate_path** (String) - Caminho seguro/S3 para arquivo .pfx
- **certificate_password** (String) - Criptografada
- **csc_token** (String) - Código de Segurança do Contribuinte
- **csc_id** (String) - Identificador do CSC
- **is_homologation** (Boolean) - Ambiente de teste/produção
- **next_nfe_number** (Integer) - Controle sequencial
- **created_at, updated_at** (DateTime)

#### Tabela: `fiscal_notes`

Histórico e gestão de notas:

- **id** (UUID, PK)
- **venda_id** (UUID, FK) - Relacionamento com a venda
- **fiscal_config_id** (UUID, FK)
- **status** (Enum: PENDING, AUTHORIZED, CANCELLED, CONTINGENCY, ERROR)
- **xml_content** (Text) - XML assinado
- **access_key** (String, 44 dígitos) - Chave da NFC-e
- **protocol_number** (String) - nProt da SEFAZ
- **danfe_url** (String) - Link para PDF
- **error_log** (JSON) - Detalhes de rejeição
- **created_at, updated_at** (DateTime)

---

## 📦 Dependências Instaladas

```json
{
  "fast-xml-parser": "^4.x",  // Manipulação rápida de XML/JSON
  "node-forge": "^1.x",        // Leitura de certificados PFX
  "bullmq": "^5.x",            // Fila de processamento
  "xml-crypto": "^6.x",        // Assinatura XML
  "crypto-js": "^4.x"          // Criptografia adicional
}
```

---

## 🔧 Componentes Principais

### A. FiscalTransformer

**Localização**: `app/services/fiscal_transformer.ts`

Converte uma Venda em XML compatível com SEFAZ (MOC 7.0):

- Mapeia campos da venda para estrutura XML
- Segue padrão NFC-e com versão 4.00
- Gera CNF (Código Numérico do Formulário) aleatório
- Suporta múltiplos itens e impostos

```typescript
const xmlContent = await FiscalTransformer.transformToXml(
  venda,
  empresa,
  fiscalConfig,
  customerCpf,
  {
    nfeNumber,
    tpEmis: 1,
  }
)
```

### B. FiscalSigner

**Localização**: `app/services/fiscal_signer.ts`

Assina XML com certificado A1:

- Lê arquivo PFX de forma segura
- Extrai chaves privada e certificado
- Assina com algoritmo SHA-256
- Anexa bloco XML de assinatura
- Tratamento de erros com mensagens claras

```typescript
const signedXml = await FiscalSigner.signXml(
  xmlContent,
  certificatePath,
  certificatePassword
)
```

### C. FiscalTransmitter

**Localização**: `app/services/fiscal_transmitter.ts`

Transmite XML para WebServices da SEFAZ:

- Cria cliente axios com suporte MTLS
- Constrói envelopes SOAP para:
  - Autorização (NFeAutorizacao4 / enviNFe)
  - Consulta de status (NFeConsultaProtocolo4 / consSitNFe)
  - Cancelamento (NFeRecepcaoEvento4 / envEvento)
- Parse de respostas XML
- Tratamento de timeouts e erros

```typescript
const transmitter = new FiscalTransmitter({
  homologation: boolean,
  state: string
})

const result = await transmitter.authorizeNFCe(xmlContent)
const status = await transmitter.queryNFCeStatus(accessKey)
await transmitter.cancelNFCe(accessKey, protocolNumber, justification, cnpj)
```

### D. FiscalService

**Localização**: `app/services/fiscal_service.ts`

Orquestra todo o fluxo de operações fiscais:

- **emitNFCe**: Fluxo completo de emissão (Transformer → Signer → Transmitter) com reserva atômica de numeração
- **queryNFCeStatus**: Consulta status em tempo real
- **cancelNFCe**: Cancela notas autorizadas
- **emitNFCeContingency**: Modo offline quando SEFAZ indisponível

```typescript
// Emissão normal
const fiscalNote = await FiscalService.emitNFCe(venda, establishmentId)

// Contingência (UC22)
const contingencyNote = await FiscalService.emitNFCeContingency(
  venda,
  establishmentId
)
```

### E. FiscalProvider

**Localização**: `providers/fiscal_provider.ts`

Gerencia certificados de forma segura:

- Cache em memória com identificador único
- Carregamento seguro de arquivos PFX
- Criptografia/descriptografia de senhas
- Limpeza periódica de cache
- Registrado no container AdonisJS

```typescript
// Dentro do container AdonisJS
const manager = app.container.use('fiscal:manager')
const cert = await manager.loadCertificate(path, password)
```

---

## 🛣️ Rotas da API

### Base: `/api/fiscal`

Todas as rotas requerem autenticação.

#### 1. **Configuração Fiscal**

```json
POST   /api/fiscal/config          → configureEstablishment()
GET    /api/fiscal/config          → getConfig()
```

#### 2. **Emissão de NFC-e**

```json
POST   /api/fiscal/emit            → emit()
```

**Payload**:

```json
{
  "venda_id": "uuid"
}
```

#### 3. **Gestão de Notas**

```json
GET    /api/fiscal/notes           → listNotes()
       ?start_date=YYYY-MM-DD
       &end_date=YYYY-MM-DD
       &status=AUTHORIZED
       &min_value=0
       &max_value=10000
       &page=1
       &limit=20

GET    /api/fiscal/status/:id      → queryStatus()
POST   /api/fiscal/cancel/:id      → cancel()
       {
         "justification": "string"
       }
```

#### 4. **Download de Documentos**

```json
GET    /api/fiscal/danfe/:id       → getDanfe()  [PDF DANFE]
GET    /api/fiscal/xml/:id         → getXml()    [XML assinado]
```

#### 5. **Exportação para Contabilidade (UC23)**

```json
GET    /api/fiscal/export-accounting  → exportAccounting()
       ?month=12&year=2024
```

---

## 📊 Fluxos de Uso

### UC21: Emissão Automática após Checkout

1. Cliente finaliza pagamento no Self-Ordering
2. Sistema chama POST /api/fiscal/emit com venda_id
3. FiscalService orquestra o pipeline (cria FiscalNote PENDING, transforma venda
  em XML, assina com certificado, transmite para SEFAZ e atualiza para
  AUTHORIZED com access_key)
4. QR Code é exibido na tela de confirmação
5. Cliente recebe NFC-e por e-mail (opcional)

### UC22: Contingência

1. Se SEFAZ estiver offline → exceção capturada
2. Sistema chama `FiscalService.emitNFCeContingency()`
3. XML é gerado e armazenado com status: CONTINGENCY
4. BullMQ agenda retransmissão automática
5. Quando SEFAZ voltar, nota é retransmitida

### UC23: Painel do Contador

1. Contador acessa `GET /api/fiscal/export-accounting?month=12&year=2024`
2. Sistema consolida todos os XMLs autorizados do período
3. Retorna arquivo .zip com documentos fiscais
4. Contador importa em software contábil

---

## 🔐 Segurança

### Certificados A1

- Armazenados em caminho seguro (S3 recomendado em produção)
- Senhas criptografadas no BD com chave de ambiente
- Carregados em memória apenas durante assinatura
- Cache com TTL configurável
- Limpeza periódica automática

### Dados Sensíveis

```typescript
// Criptografia de senhas
const encrypted = FiscalProvider.encryptSensitiveData(password)
const decrypted = FiscalProvider.decryptSensitiveData(encrypted)

// Variável de ambiente necessária
FISCAL_ENCRYPTION_KEY=sua-chave-aqui
```

### Autenticação & Autorização

- Todas as rotas requerem middleware `auth()`
- Acesso filtrado por `establishment_id`
- Validação de dados de entrada com Vine
- Logging de todas as operações

---

## 📝 Migração do Banco de Dados

```bash
# Criar as tabelas
node ace migration:run

# Reverter (se necessário)
node ace migration:rollback
```

**Migrations criadas**:

- `database/migrations/1734634800000_create_fiscal_configs_table.ts`
- `database/migrations/1734634900000_create_fiscal_notes_table.ts`

---

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

```env
# Criptografia de certificados
FISCAL_ENCRYPTION_KEY=sua-chave-segura-aqui

# Certificados (opcional, em produção usar S3)
FISCAL_CERT_STORAGE=local  # ou 's3'
FISCAL_CERT_PATH=/secure/certs/

# SEFAZ
FISCAL_SEFAZ_STATE=SP       # Estado padrão
FISCAL_SEFAZ_HOMOLOG=false  # Usar ambiente de produção
```

### 2. Registrar Provider

✅ Já feito em `adonisrc.ts`:

```typescript
providers: [
  ...
  () => import('#providers/fiscal_provider'),
]
```

### 3. Configurar Primeiro Estabelecimento

```bash
curl -X POST http://localhost:3333/api/fiscal/config \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificate_path": "/path/to/cert.pfx",
    "certificate_password": "senha123",
    "csc_token": "token-contribuinte",
    "csc_id": "12345",
    "is_homologation": true
  }'
```

---

## 🧪 Testes

### Teste de Emissão

```bash
POST /api/fiscal/emit
Authorization: Bearer <token>
Content-Type: application/json

{
  "venda_id": "12345678-1234-1234-1234-123456789012"
}
```

### Teste de Consulta

```bash
GET /api/fiscal/notes?status=AUTHORIZED
Authorization: Bearer <token>
```

### Teste de Exportação

```bash
GET /api/fiscal/export-accounting?month=12&year=2024
Authorization: Bearer <token>
```

---

## 📦 Próximos Passos

### Phase 2 - BullMQ Integration

- [ ] Implementar fila de emissão assíncrona
- [ ] Retransmissão automática em contingência
- [ ] Limpeza periódica de cache de certificados

### Phase 3 - DANFE PDF Generation

- [ ] Integrar biblioteca de geração de PDF (pdf-kit ou similar)
- [ ] Armazenar PDFs em S3
- [ ] Gerar QR code nas notas

### Phase 4 - Webhook da SEFAZ

- [ ] Recepcionar notificações de status
- [ ] Atualizar automaticamente notas autorizadas
- [ ] Alertas em tempo real

### Phase 5 - Documentação para Desenvolvedores

- [ ] Swagger/OpenAPI
- [ ] Exemplos de integração
- [ ] Guia de troubleshooting

---

## 📚 Referências

- **Manual de Orientação do Contribuinte (MOC 7.0)**: Padrão de formatação de NFC-e
- **Documentação SEFAZ**: <https://www.sefaz.rs.gov.br/>
- **AdonisJS Docs**: <https://docs.adonisjs.com/>
- **Node-forge**: Manipulação de certificados X.509

---

## 🤝 Suporte

Para dúvidas técnicas ou relatórios de bugs, abra uma issue no repositório do projeto.

---

**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024  
**Status**: Implementação Inicial ✅
