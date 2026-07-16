# Prompt - Visão Geral do Sistema

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Construir um panorama de concerns transversais (logging, timezone e formatacao).
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - docs/TIMEZONE_USUARIO.md
  - docs/formatacao-numerica.md
  - docs/ACESSIBILIDADE_WCAG.md
  - docs/DEPLOYMENT.md

Pedido

1) Resuma regras transversais que afetam todos os modulos.
2) Mapeie pontos de configuração e padrões obrigatorios por camada.
3) Liste riscos sistemicos (observabilidade insuficiente, timezone incorreto, formatacao inconsistente).
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Priorize diretrizes reutilizaveis em vez de detalhes de uma unica feature.
- Responda em PT-BR, salvo instrução contrária.
