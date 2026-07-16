# Prompt - Testes e Qualidade

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Mapear cobertura de fluxos operacionais e gates de qualidade para atendimento sem regressao.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/TESTING.md
  - suites de teste de mesas/comandas/fechamento
  - scripts npm de lint, typecheck e build

Pedido

1) Liste cenarios críticos cobertos e não cobertos no fluxo operacional.
2) Defina prioridades de testes de regressao para status e fechamento.
3) Aponte riscos de qualidade em picos de uso e concorrência.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Diferencie claramente testes unitarios, integração e smoke tests de operação.
- Responda em PT-BR, salvo instrução contrária.
