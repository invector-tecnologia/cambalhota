# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Mapear arquitetura do atendimento por tickets conversacionais entre usuario e admin.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/SUPORTE_TICKETS_CICLO.md
  - app/controllers/support_tickets_controller.ts
  - app/controllers/admin_support_tickets_controller.ts

Pedido

1) Descreva fluxo arquitetural de abertura, resposta, sugestao e resolução.
2) Identifique fronteiras entre camada HTTP, service de domínio e persistência.
3) Aponte dependencias com dashboard/admin e riscos de acoplamento.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Evidenciar separacao de responsabilidades entre ator usuario, admin e sistema.
- Responda em PT-BR, salvo instrução contrária.
