# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Documentar rotas de atendimento em salão e contratos HTTP associados.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/INDEX.md
  - docs/MESAS_COMANDAS.md
  - start/routes.ts
  - app/controllers/**/*mesa* e *comanda*

Pedido

1) Liste rotas UI e API da operação (ex.: /mesas, /comandas, /api/mesas/:id/status) com metodo e responsabilidade.
2) Descreva auth/middleware e pontos de autorizacao por perfil.
3) Valide contratos de request/response relevantes para status de mesa/comanda e fechamento.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Destaque divergencias entre docs e implementacao de rotas quando encontrar.
- Responda em PT-BR, salvo instrução contrária.
