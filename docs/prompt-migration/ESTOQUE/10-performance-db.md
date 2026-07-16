# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Identificar gargalos de consulta e escrita em movimentacoes de estoque.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - consultas de cardápio, saldo e histórico de movimentação
  - migracoes/indices de tabelas de estoque
  - docs/REPROCESSAMENTO.md

Pedido

1) Liste consultas de maior custo no ciclo de estoque.
2) Aponte riscos de lock e contencao em atualizacao de saldo.
3) Proponha medicao de latencia e validação de indice por consulta critica.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Separar evidência de banco de dados e evidência de aplicação.
- Responda em PT-BR, salvo instrução contrária.
