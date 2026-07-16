# Prompt - Visão Geral do Sistema

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Construir um panorama dos fluxos de reprocessamento administrativo e recuperacao de falhas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/REPROCESSAMENTO.md
  - docs/INDEX.md
  - docs/LOGGING.md

Pedido

1) Resuma quais eventos/entidades entram em reprocessamento e por que.
2) Explique dependencia entre fila de falhas, operação manual e jobs.
3) Liste riscos de duplicidade, corrida e retrabalho.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Em análises de risco, explicite impacto operacional e impacto fiscal/financeiro.
- Responda em PT-BR, salvo instrução contrária.
