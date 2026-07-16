# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Mapear componentes de atendimento no salão e fronteiras com financeiro, estoque e fiscal.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/MESAS_COMANDAS.md
  - docs/DESCONTO_VENDAS.md
  - start/routes.ts e controllers de mesas/comandas

Pedido

1) Descreva o fluxo arquitetural de abertura de mesa/comanda ate fechamento.
2) Identifique limites entre UI, controllers e services de domínio.
3) Aponte pontos de acoplamento com modulos externos e riscos de dependencia.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Diferencie claramente camada de orquestracao HTTP e camada de regra de negocio.
- Responda em PT-BR, salvo instrução contrária.
