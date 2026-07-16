# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack IMPRESSAO.
Objetivo: Identificar entidades e campos críticos para configuração e rastreio de impressao.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/MODULO_IMPRESSAO_NOTAS.md
  - models/migrations ligados a configuração de impressao
  - relação com entidades de venda/documento

Pedido

1) Liste entidades e campos usados para parametrizar impressao.
2) Destaque relacoes com venda, documento fiscal e auditoria.
3) Aponte riscos de falta de rastreabilidade ou duplicidade de impressao.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre explicitar identificador de correlacao entre pedido/documento e impressao.
- Responda em PT-BR, salvo instrução contrária.
