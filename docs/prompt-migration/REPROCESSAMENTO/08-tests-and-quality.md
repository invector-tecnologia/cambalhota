# Prompt - Testes e Qualidade

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Mapear cobertura de retries e gates de qualidade para evitar regressao em processamento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/TESTING.md
  - testes de jobs, filas e reprocessamento
  - scripts de build/typecheck/lint

Pedido

1) Liste cenarios cobertos para sucesso, retry e falha definitiva.
2) Identifique lacunas em idempotencia e concorrência.
3) Priorize regressao para evitar duplicidade e perda de evento.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Explicitar teste minimo de carga para rotinas mais criticas, quando houver.
- Responda em PT-BR, salvo instrução contrária.
