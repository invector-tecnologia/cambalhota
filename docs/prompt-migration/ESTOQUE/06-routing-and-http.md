# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Documentar rotas de cardápio, almoxarifado e movimentações de estoque.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias: docs/INDEX.md, docs/ESTOQUE.md, start/routes.ts e controllers de cardápio/almoxarifado.

Pedido

1) Liste rotas UI/API de estoque (ex.: /cardápio/*, /almoxarifado/insumos, /almoxarifado/nfes).
2) Descreva métodos HTTP, middlewares e contratos de payload/validação.
3) Aponte onde há operações sensíveis (ajuste manual, entrada por NFe, baixa automática).
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs utilizados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Quando houver endpoints de escrita, sempre destaque requisitos de consistência transacional.
- Responda em PT-BR, salvo instrução contrária.
