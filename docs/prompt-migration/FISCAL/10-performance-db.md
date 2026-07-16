# Prompt - Performance e Banco (Fiscal)

Role: Você está revisando gargalos de performance fiscal e impacto em banco.
Objetivo: Identificar hotspots de consulta, reprocessamento e filas de pendencia.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Referencias:
  - `app/models/fiscal_note.ts`
  - `app/services/fiscal_reprocessing_service.ts`
  - migrations de indices em tabelas fiscais
  - `docs/FISCAL_TRANSMISSION_DEBUG.md`

Pedido

1) Liste consultas e filtros de maior volume esperado.
2) Avalie indices relevantes para pendencias e retries.
3) Aponte mitigacoes para backlog fiscal (batch, janela, limite, observabilidade).
4) Se houver ação solicitada, plano curto e numerado.

Restrições

- Não estimar volumes sem evidência.
- Marque hipoteses explicitamente.
