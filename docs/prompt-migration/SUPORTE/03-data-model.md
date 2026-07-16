# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Identificar entidades de ticket/mensagem e campos críticos de status e SLA.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/SUPORTE_TICKETS_CICLO.md
  - models/migrations de suporte_solicitacoes e suporte_mensagens
  - relacoes com usuario/empresa/admin

Pedido

1) Liste entidades e relacoes do ciclo conversacional.
2) Destaque campos de status, prioridade e leitura/notificacao.
3) Aponte riscos de histórico inconsistente e perda de contexto.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Explicitar sempre os campos que controlam transicoes de estado do ticket.
- Responda em PT-BR, salvo instrução contrária.
