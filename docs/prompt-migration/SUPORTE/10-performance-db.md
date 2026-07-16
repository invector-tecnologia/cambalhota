# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Identificar gargalos de leitura/escrita em tickets e mensagens de suporte.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - consultas de listagem de tickets e thread de mensagens
  - indices em suporte_solicitacoes e suporte_mensagens
  - docs/SUPORTE_TICKETS_CICLO.md

Pedido

1) Liste consultas de maior custo no painel e tela de tickets.
2) Aponte riscos de backlog de mensagens e paginação insuficiente.
3) Proponha verificacoes de indices e metas de latencia.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Separar gargalo de consulta de thread e gargalo de atualizacao de status.
- Responda em PT-BR, salvo instrução contrária.
