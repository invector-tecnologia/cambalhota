# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Documentar checklist de release de reprocessamento com smoke tests de fila e retry.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - docs/REPROCESSAMENTO.md
  - comandos de admin processing

Pedido

1) Defina checklist de release para evitar bloqueio de filas.
2) Liste smoke tests de deteccao e reexecucao de pendencias.
3) Descreva rollback e validação de retomada segura.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Em mudanças de fila, sempre incluir plano de drenagem controlada.
- Responda em PT-BR, salvo instrução contrária.
