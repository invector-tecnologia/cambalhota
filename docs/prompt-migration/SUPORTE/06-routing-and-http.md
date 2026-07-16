# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Documentar rotas de tickets de suporte para usuario e administração.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/INDEX.md
  - docs/SUPORTE_TICKETS_CICLO.md
  - start/routes.ts
  - app/controllers/support_tickets_controller.ts
  - app/controllers/admin_support_tickets_controller.ts

Pedido

1) Liste rotas de usuario (/suporte/tickets) e admin (/admin/support-tickets) com métodos e uso.
2) Descreva middlewares de auth e segregacao de permissao entre perfis.
3) Valide contratos de criar ticket, responder, sugerir solucao, cancelar e confirmar resolução.
4) Valide a regra de UX: indicador de conectividade de suporte deve aparecer apenas para usuario em `/suporte/tickets*`.
5) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sinalize endpoints com mudanca de status e seus gatilhos.
- Responda em PT-BR, salvo instrução contrária.
