# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack ADMIN.
Objetivo: Documentar checklist de release admin com smoke tests de governanca e suporte.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - docs/ADMIN_ASSINATURAS_SUPORTE.md
  - rotas administrativas para smoke test

Pedido

1) Defina checklist pre e pos deploy para painel admin.
2) Liste smoke tests de permissao, dashboard e operações sensiveis.
3) Descreva rollback com validação de integridade administrativa.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Toda mudanca admin deve prever validação de autorizacao pos release.
- Responda em PT-BR, salvo instrução contrária.
