# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack IMPRESSAO.
Objetivo: Identificar gargalos de throughput e persistência relacionados a impressao.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - consultas de histórico de impressao e status
  - jobs/filas de envio quando aplicável
  - docs/LOGGING.md

Pedido

1) Liste gargalos de escrita/leitura no ciclo de impressao.
2) Aponte riscos de backlog em picos de emissão.
3) Proponha indicadores de desempenho e verificacoes de capacidade.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Separar claramente gargalo de fila/processamento e gargalo de banco.
- Responda em PT-BR, salvo instrução contrária.
