# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Identificar gargalos de fila, consulta e escrita em ciclos de reprocessamento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - consultas de pendencias e histórico de retries
  - indices de tabelas de processamento
  - docs/REPROCESSAMENTO.md

Pedido

1) Liste gargalos de leitura/escrita na fila de pendencias.
2) Aponte riscos de backlog em picos e janelas de recuperação.
3) Proponha medicao de throughput e tuning baseado em dados.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Diferencie gargalo de fila, banco e worker na conclusao.
- Responda em PT-BR, salvo instrução contrária.
