# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack FINANCEIRO.
Objetivo: Identificar entidades de vendas e campos críticos de valor, desconto e total.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/GUIA_MANUTENCAO_FINANCEIRO.md
  - docs/DESCONTO_VENDAS.md
  - models/migrations de vendas e itens

Pedido

1) Liste entidades e relacoes de composicao do valor final.
2) Destaque campos de subtotal, desconto, acrescimo e total.
3) Aponte riscos de arredondamento e inconsistencias de agregacao.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre explicitar escala numerica e representacao monetaria quando identificada.
- Responda em PT-BR, salvo instrução contrária.
