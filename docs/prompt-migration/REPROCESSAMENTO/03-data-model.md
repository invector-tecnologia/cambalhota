# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Identificar entidades de pendencia e campos críticos de status, tentativa e erro.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/REPROCESSAMENTO.md
  - models/migrations de filas, pendencias e logs correlatos
  - entidades alvo impactadas pelo retry

Pedido

1) Liste entidades e relacoes usadas para controlar retries.
2) Destaque campos de status, contador e motivo de falha.
3) Aponte riscos de duplicidade e perda de rastreabilidade.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre explicitar idempotency key ou estrategia equivalente quando existir.
- Responda em PT-BR, salvo instrução contrária.
