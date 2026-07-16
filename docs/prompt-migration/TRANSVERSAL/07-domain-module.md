# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Descrever regras transversais de consistência, observabilidade e comportamento comum.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - docs/TIMEZONE_USUARIO.md
  - docs/formatacao-numerica.md
  - services/helpers compartilhados

Pedido

1) Liste invariantes transversais que devem ser respeitados em qualquer módulo.
2) Descreva regras de logs, correlacao e rastreabilidade minima.
3) Explique como timezone e formatacao impactam regras de negocio e exibicao.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Evite especificar regra local de módulo; priorize regra global aplicável em todo sistema.
- Responda em PT-BR, salvo instrução contrária.
