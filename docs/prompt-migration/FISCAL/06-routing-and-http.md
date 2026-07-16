# Prompt - Rotas e Fluxo HTTP Fiscal

Role: Você está revisando endpoints e fluxo HTTP do módulo fiscal.
Objetivo: Consolidar rotas de UI/API, autenticacao e contratos de entrada/saída.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Referencias:
  - `start/routes.ts`
  - `app/controllers/fiscal_controller.ts`
  - `app/controllers/fiscal_config_controller.ts`
  - `docs/fiscal-api.md`

Pedido

1) Separe rotas UI e API do fiscal.
2) Explique requisitos de auth e autorizacao.
3) Liste operações sensiveis (emitir, cancelar, retry, exportar).
4) Se houver ação solicitada, plano numerado com validação.

Restrições

- Foque em estrutura, não em listagem exaustiva.
- Marque lacunas no contrato quando necessario.
