# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Descrever regras de negocio de ciclo de ticket e conversacao assitida.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/SUPORTE_TICKETS_CICLO.md
  - app/services/support_ticket_service.ts
  - models/migrations de suporte_solicitacoes e suporte_mensagens

Pedido

1) Modele estados do ticket e eventos de transicao (abrir, responder, sugerir, cancelar, resolver).
2) Inclua regra de auto-resolução por 3 mensagens admin sem resposta do usuario.
3) Liste invariantes de notificacao e histórico conversacional.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Se houver ambiguidade, explicitar diferenca entre status de conversa e status de resolução.
- Responda em PT-BR, salvo instrução contrária.
