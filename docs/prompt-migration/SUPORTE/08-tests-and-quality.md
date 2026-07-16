# Prompt - Testes e Qualidade

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Mapear cobertura de regras conversacionais e gates de qualidade do suporte.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/TESTING.md
  - testes de fluxo de tickets e mensagens
  - scripts npm de qualidade

Pedido

1) Liste cenarios cobertos para abertura, resposta, cancelamento e resolução.
2) Identifique lacunas de teste na regra de 3 mensagens sem resposta.
3) Priorize regressao para notificacao e integridade do histórico.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Diferenciar testes de regra de negocio e testes de UI de atendimento.
- Responda em PT-BR, salvo instrução contrária.
