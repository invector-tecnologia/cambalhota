# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack ADMIN.
Objetivo: Mapear arquitetura de governanca administrativa de empresas, assinaturas e suporte.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/ADMIN_ASSINATURAS_SUPORTE.md
  - docs/SUPORTE_TICKETS_CICLO.md
  - app/controllers/admin_controller.ts e controladores admin de suporte

Pedido

1) Descreva o fluxo arquitetural do dashboard admin e modulos satelite.
2) Identifique fronteiras entre autorizacao, orquestracao e regra de negocio.
3) Aponte pontos de alto risco operacional e controles existentes.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Em qualquer fluxo sensivel, explicitar trilha de auditoria esperada.
- Responda em PT-BR, salvo instrução contrária.
