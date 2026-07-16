# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Mapear arquitetura de cardápio e almoxarifado com foco em disponibilidade de itens.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/ESTOQUE.md
  - start/routes.ts e controllers de cardápio/almoxarifado
  - services de movimentação e baixa

Pedido

1) Descreva o fluxo arquitetural de entrada, ajuste e baixa de estoque.
2) Identifique fronteiras entre cadastro, movimentação e consumo por venda.
3) Aponte acoplamentos com financeiro/fiscal e riscos de consistência.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Priorize visão de componentes que afetam disponibilidade em tempo real.
- Responda em PT-BR, salvo instrução contrária.
