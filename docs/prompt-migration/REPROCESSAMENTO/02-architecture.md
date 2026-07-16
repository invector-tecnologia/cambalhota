# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Mapear arquitetura de reexecucao, filas de pendencia e ações administrativas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/REPROCESSAMENTO.md
  - controllers/services/commands de processing
  - docs/LOGGING.md

Pedido

1) Descreva fluxo arquitetural de detecao, fila, reprocessamento e encerramento.
2) Identifique fronteiras entre ação automática e ação manual de admin.
3) Aponte acoplamentos com fiscal/financeiro e riscos sistêmicos.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Separar claramente fluxo sincrono e assincrono na arquitetura.
- Responda em PT-BR, salvo instrução contrária.
