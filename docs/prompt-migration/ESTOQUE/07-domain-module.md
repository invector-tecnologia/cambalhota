# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Descrever regras de negócio de disponibilidade, entradas, baixas e reconciliação.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias: docs/ESTOQUE.md, services de estoque/almoxarifado e validators de movimentação/cadastro.

Pedido

1) Descreva eventos de domínio (entrada, saída, ajuste, baixa por venda).
2) Explique regras de saldo mínimo, indisponibilidade e impacto no cardápio.
3) Liste riscos de ruptura, saldo negativo e dessintonia entre físico e sistema.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs utilizados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Explicite invariantes que devem permanecer verdadeiros após cada movimentação.
- Responda em PT-BR, salvo instrução contrária.
