# Guia rapido - fluxo fiscal (NFC-e)

Este guia apresenta o fluxo típico para configurar e operar o módulo fiscal do Tavolo (NFC-e), via UI e API.

## Pré‑requisitos

- FISCAL_ENCRYPTION_KEY definida (validada em start/env.ts). Em producao (Heroku), configure via heroku config:set.
- Estabelecimento com `FiscalConfig` ativa (pode ser criada pela API abaixo).
- Usuário autenticado com vínculo ao estabelecimento.

## Visão Geral (UI)

1. Acesse /fiscal (Dashboard -> Financeiro -> Fiscal).
2. Use os filtros (data/status) e consulte o resumo por status.
3. Nas ações da lista: Detalhes (modal), DANFE, XML, Status, Cancelar.
4. Para contabilidade, informe mês/ano e baixe o ZIP dos XMLs.

## Passo a passo (API)

Todas as rotas em `/api/fiscal/*` exigem autenticação.

### 1) Configurar parâmetros fiscais

Request:

```bash
curl -X POST https://<host>/api/fiscal/config \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<...>" \
  -d '{
    "certificate_path": "/app/certs/empresa-a1.pfx",
    "certificate_password": "minha-senha",
    "csc_token": "TOKEN_CSC",
    "csc_id": "000001",
    "is_homologation": true
  }'
```

Resposta: 200, com `config` (sem a senha do certificado).

### 2) Emitir NFC-e para uma venda

```bash
curl -X POST https://<host>/api/fiscal/emit \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<...>" \
  -d '{ "venda_id": "<ID_DA_VENDA>" }'
```

Resposta: `success: true` e dados da `fiscal_note` (podem incluir `status=PENDING` até autorização).

### 3) Consultar status na SEFAZ

```bash
curl https://<host>/api/fiscal/status/<FISCAL_NOTE_ID> \
  -H "Cookie: session=<...>"
```

Resposta (exemplo):

```json
{
  "success": true,
  "current_status": "AUTHORIZED",
  "sefaz_status": { "code": "100", "message": "Autorizado o uso" }
}
```

### 4) Obter documentos

- DANFE (URL):

```bash
curl https://<host>/api/fiscal/danfe/<FISCAL_NOTE_ID> -H "Cookie: session=<...>"
```

- XML (download):

```bash
curl -OJ https://<host>/api/fiscal/xml/<FISCAL_NOTE_ID> -H "Cookie: session=<...>"
```

### 5) Cancelar nota autorizada

```bash
curl -X POST https://<host>/api/fiscal/cancel/<FISCAL_NOTE_ID> \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: <csrfToken>" \
  -H "Cookie: session=<...>" \
  -d '{ "justification": "Cancelamento por erro de emissão (exemplo)" }'
```

Resposta: `success: true`.

### 6) Exportação contábil (ZIP)

```bash
curl -OJ "https://<host>/api/fiscal/export-accounting.zip?month=12&year=2025" \
  -H "Cookie: session=<...>"
```

Gera `nfce_2025_12.zip` com os XMLs autorizados do período.

## Troubleshooting

- Erro: "Missing environment variable FISCAL_ENCRYPTION_KEY": defina a env no ambiente (Heroku: `heroku config:set FISCAL_ENCRYPTION_KEY=...`).
- Release Heroku falhou no `start/env.js`: normalmente é ausência de env obrigatória; defina e redeploy.
- status=ERROR ou CONTINGENCY: utilize a consulta de status e reavalie reprocessamento.

## Referências

- UI: resources/views/fiscal/index.edge
- Controller UI: app/controllers/fiscal_pages_controller.ts
- API: app/controllers/fiscal_controller.ts (endpoints `emit`, `notes`, `status`, `cancel`, `danfe`, `xml`, `export-accounting(.zip)`).
- Rotas: start/routes.ts (`/fiscal` e `/api/fiscal/*`).
