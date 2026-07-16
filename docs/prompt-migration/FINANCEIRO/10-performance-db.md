# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack FINANCEIRO.
Objetivo: Identificar gargalos de consultas financeiras e cálculo de totais em volume.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - consultas de vendas, relatorios e totais
  - indices em tabelas de venda/itens
  - docs/GUIA_MANUTENCAO_FINANCEIRO.md

Pedido

1) Liste consultas de maior custo no módulo financeiro.
2) Aponte riscos de agregacoes pesadas e filtros sem indice.
3) Proponha estrategia de medicao de latencia e tuning orientado a evidência.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Distinga gargalo de CPU de aplicação e gargalo de banco.
- Responda em PT-BR, salvo instrução contrária.
