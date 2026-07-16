# Tavolo Fiscal UI

## Rotas relacionadas

- UI: /fiscal
- API: /api/fiscal/*

Esta documentação descreve a área Fiscal (UI) e como utilizá-la para consultar notas fiscais (NFC-e), executar ações comuns e exportar arquivos para contabilidade.

## Acesso e Navegação

- Caminho protegido: `/fiscal` (requer autenticação)
- Menu: Dashboard → Financeiro → Fiscal
- Controller de página: `app/controllers/fiscal_pages_controller.ts`
- View: `resources/views/fiscal/index.edge`

## Funcionalidades

- Resumo por status (cards): Total, Autorizadas, Pendentes, Canceladas, Contingência, Erros.
- Filtros: Data inicial/final, Status, Itens por página.
- Lista de notas com colunas: Data, Chave de Acesso, Protocolo, Status, Ações.
- Ações por nota:
  - Detalhes (modal com ID, venda, status, chave, protocolo, timestamps e log de erro, se houver)
  - Abrir DANFE (URL)
  - Baixar XML
  - Consultar Status (SEFAZ)
  - Cancelar (apenas quando `status=AUTHORIZED`)
- Exportação contábil: download de arquivo ZIP com XMLs autorizados por mês/ano.

## Filtros suportados (querystring)

- `start_date`: string (YYYY-MM-DD)
- `end_date`: string (YYYY-MM-DD)
- `status`: `PENDING|AUTHORIZED|CANCELLED|CONTINGENCY|ERROR`
- `page`: número (default 1)
- `limit`: número (default 20)

## Requisitos

- A funcionalidade exige uma `FiscalConfig` ativa para o estabelecimento do usuário (associação via `establishment_id`).
- Variáveis de ambiente:
  - `FISCAL_ENCRYPTION_KEY` (obrigatória; validada em `start/env.ts`)
- Dependência para ZIP: `archiver` (e `@types/archiver` para desenvolvimento).

## Segurança

- Todas as rotas UI e API fiscais estão protegidas por middleware de autenticação (`middleware.auth()`).
- Ação de cancelamento usa CSRF Token na UI: header `X-CSRF-TOKEN` com valor de `{{ csrfToken }}` presente no `<meta>` da página.

## Observações de UX

- O botão "Detalhes" abre um modal leve via fetch do endpoint de detalhe.
- O botão "Copiar" ao lado da chave de acesso usa a API Clipboard do navegador.
- Exportação ZIP realiza o download direto em um arquivo nomeado `nfce_YYYY_MM.zip`.

## Arquivos e Pontos de Extensão

- UI:
  - Página: `resources/views/fiscal/index.edge`
  - Controller (UI): `app/controllers/fiscal_pages_controller.ts`
- API:
  - Controller (API): `app/controllers/fiscal_controller.ts`
  - Rotas: `start/routes.ts` (`/api/fiscal/*`)
- Modelos:
  - `app/models/fiscal_note.ts`
  - `app/models/fiscal_config.ts`

## Roadmap (sugestões)

- Seleção em massa para operações de exportação e/ou cancelamento.
- Filtros adicionais (por venda, cliente, faixa de valor se houver coluna).
- Reenvio/reattempt automático para notas em `ERROR` ou `CONTINGENCY`.
- Visualização inline de DANFE (quando tecnicamente possível), além do link externo.
