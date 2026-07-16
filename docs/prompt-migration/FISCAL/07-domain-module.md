# Prompt - Fluxo de Negocio Fiscal (NFC-e)

Role: Você está analisando regras de negocio do ciclo fiscal.
Objetivo: Descrever fluxo real de emissão, retries e estados de nota.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes:
  - `docs/FISCAL_ENGINE_GUIDE.md`
  - `docs/FISCAL_ENGINE_EXAMPLES.md`
  - `docs/FISCAL_EMISSION_FIX.md`
  - `app/services/fiscal_emission_workflow.ts`
  - `app/services/fiscal_reprocessing_service.ts`

Pedido

1) Explique o fluxo por estados (PENDING, AUTHORIZED, ERROR etc).
2) Explique gatilhos de retry automático e manual.
3) Explique criterios de bloqueio (max tentativas, retryable false).
4) Se houver ação solicitada, plano curto e verificável.

Restrições

- Priorize regras implementadas no código atual.
- Marque divergencias entre docs e implementacao.
