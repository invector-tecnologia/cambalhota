# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Mapear arquitetura de concerns transversais aplicadas a todos os modulos.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - docs/TIMEZONE_USUARIO.md
  - docs/formatacao-numerica.md
  - middleware/helpers compartilhados

Pedido

1) Descreva como regras transversais atravessam camadas e stacks.
2) Identifique pontos de centralizacao e pontos de duplicacao de regra.
3) Aponte riscos de inconsistência sistêmica e governança técnica.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Priorizar padrões reutilizaveis e evitar conclusoes locais de uma unica feature.
- Responda em PT-BR, salvo instrução contrária.
