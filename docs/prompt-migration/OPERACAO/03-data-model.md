# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Identificar entidades operacionais de mesa/comanda e campos críticos de fechamento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/MESAS_COMANDAS.md
  - docs/DESCONTO_VENDAS.md
  - models/migrations de mesas, comandas, itens e vendas

Pedido

1) Liste entidades e relacoes essenciais para operação de salão.
2) Destaque campos que controlam status e totalização.
3) Aponte riscos de integridade referencial e concorrência de atualizacao.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre explicitar chave de negocio usada para correlacao operacional.
- Responda em PT-BR, salvo instrução contrária.
