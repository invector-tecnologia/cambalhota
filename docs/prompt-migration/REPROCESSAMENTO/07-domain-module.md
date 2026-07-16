# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Descrever regras de negocio de retry, idempotencia e encerramento de pendencias.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/REPROCESSAMENTO.md
  - services/jobs/commands ligados a pendencias
  - docs/LOGGING.md

Pedido

1) Descreva estados da pendencia (novo, em processamento, reprocessado, falha definitiva).
2) Explicite regras de idempotencia e deduplicacao por chave de negocio.
3) Liste criterios de encerramento, escalonamento e alerta.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre diferenciar erro transitorio de erro definitivo na análise.
- Responda em PT-BR, salvo instrução contrária.
