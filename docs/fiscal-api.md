# Tavolo Fiscal API

API do modulo fiscal (NFC-e) usada pela UI e integracoes. Todas as rotas estao sob prefixo /api/fiscal e requerem autenticacao.

## Autenticação e segurança

- Middleware: `middleware.auth()`
- CSRF: necessário para métodos mutadores quando invocados desde a UI (ex.: cancelamento)
- Escopo: operações são restritas ao `establishment_id` do usuário autenticado

## Endpoints

### Configuração Fiscal

- `POST /api/fiscal/config` (`fiscal.config.store`)
  - Body: `certificate_path`, `certificate_password`, `csc_token`, `csc_id`, `is_homologation`
  - Efeito: cria/atualiza `FiscalConfig` para o estabelecimento
- `GET /api/fiscal/config` (`fiscal.config.show`)
  - Retorna configuração fiscal (sem a senha do certificado)

### Emissao

- POST /api/fiscal/emit (fiscal.emit)
  - Body: { venda_id }
  - Emite NFC-e para a venda informada

### Notas

- `GET /api/fiscal/notes` (`fiscal.notes.list`)
  - Filtros: `start_date`, `end_date`, `status`, `min_value`, `max_value`, `page`, `limit`
  - Retorna paginacao de FiscalNote do estabelecimento do usuario
- `GET /api/fiscal/notes/:id` (`fiscal.notes.show`) [NOVO]
  - Detalhe de uma nota (campos: id, status, access_key, protocol_number, danfe_url, created_at, updated_at, error_log)

### Documentos

- `GET /api/fiscal/danfe/:id` (`fiscal.danfe.download`)
  - Retorna URL para DANFE (se disponível)
- `GET /api/fiscal/xml/:id` (`fiscal.xml.download`)
  - Faz download do XML da nota

### Ações e Status

- `GET /api/fiscal/status/:id` (`fiscal.notes.status`)
  - Consulta status da NFC-e na SEFAZ
- `POST /api/fiscal/cancel/:id` (`fiscal.notes.cancel`)
  - Body: `{ justification }` (mín. 15 chars)
  - Cancela nota autorizada

### Exportação Contábil

- `GET /api/fiscal/export-accounting` (`fiscal.export.accounting`)
  - Query: `month`, `year`
  - Retorna JSON com resumo das notas do período
- `GET /api/fiscal/export-accounting.zip` (`fiscal.export.accountingZip`) [NOVO]
  - Query: `month`, `year`
  - Retorna um arquivo ZIP stream com os XMLs autorizados do período

## Exemplos

### Detalhe da nota

Request:

```
GET /api/fiscal/notes/6f3c... HTTP/1.1
Cookie: session=...
```

Response (200):

```json
{
  "success": true,
  "data": {
    "id": "6f3c...",
    "status": "AUTHORIZED",
    "access_key": "NFe3519...",
    "protocol_number": "1234567890",
    "danfe_url": "https://...",
    "created_at": "2025-12-19T12:34:56.000Z",
    "updated_at": "2025-12-19T12:40:01.000Z",
    "error_log": null
  }
}
```

### Exportação ZIP

Request:

```
GET /api/fiscal/export-accounting.zip?month=12&year=2025 HTTP/1.1
Cookie: session=...
```

Response (200): Content-Type: `application/zip` com arquivo `nfce_2025_12.zip`.

## Dependências

- `archiver` para geração do ZIP (streaming)

## Variáveis de ambiente

- `FISCAL_ENCRYPTION_KEY`: obrigatória (validada em `start/env.ts`). Usada pelo `FiscalProvider` para criptografia/descrição de segredos fiscais.

## Códigos-fonte relevantes

- Controller (API): `app/controllers/fiscal_controller.ts`
- Rotas: `start/routes.ts` (prefixo `/api/fiscal`)
- Provider: `providers/fiscal_provider.ts`
- Models: `app/models/fiscal_note.ts`, `app/models/fiscal_config.ts`
