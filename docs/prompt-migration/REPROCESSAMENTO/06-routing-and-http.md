# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Documentar rotas admin de reprocessamento e contratos HTTP de reexecucao.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/INDEX.md
  - docs/REPROCESSAMENTO.md
  - start/routes.ts
  - controllers/commands de admin processing

Pedido

1) Liste rotas e ações de reprocessamento (ex.: /admin/processing) com metodo e finalidade.
2) Descreva requisitos de auth/autorizacao para reexecutar processamento.
3) Valide contratos de entrada (filtros, ids, janelas) e saída (resultado, erro, parcial).
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Aponte riscos de endpoints que possam disparar processamento em massa.
- Responda em PT-BR, salvo instrução contrária.
