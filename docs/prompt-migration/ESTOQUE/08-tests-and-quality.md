# Prompt - Testes e Qualidade

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Mapear cobertura de fluxos de estoque e gates de qualidade contra divergencia de saldo.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/TESTING.md
  - testes de cadastro e movimentação de estoque
  - scripts npm de qualidade

Pedido

1) Liste cenarios cobertos para entrada, baixa, ajuste e reconciliação.
2) Identifique lacunas de teste em concorrência e idempotencia.
3) Priorize suite de regressao para evitar ruptura indevida.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Diferencie testes de regra de negocio dos testes de interface de cadastro.
- Responda em PT-BR, salvo instrução contrária.
