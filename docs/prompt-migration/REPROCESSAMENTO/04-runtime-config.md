# Prompt - Configuração de Runtime

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Mapear configuracoes de runtime que controlam retries, janelas e cargas de processamento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/REPROCESSAMENTO.md
  - config/*.ts e variaveis de ambiente de jobs/processamento
  - scripts e comandos de reprocessamento

Pedido

1) Liste configuracoes que afetam taxa e limite de reprocessamento.
2) Identifique defaults perigosos para processamento em massa.
3) Aponte riscos de sobrecarga e como mitigar por configuração.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Destacar impacto de cada configuração em custo e estabilidade.
- Responda em PT-BR, salvo instrução contrária.
