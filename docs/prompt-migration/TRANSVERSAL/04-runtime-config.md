# Prompt - Configuração de Runtime

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Mapear configuracoes globais de runtime que impactam comportamento sistêmico.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - config/*.ts
  - docs/DEPLOYMENT.md
  - docs/TIMEZONE_USUARIO.md e docs/formatacao-numerica.md

Pedido

1) Liste configuracoes globais com impacto em multiplos modulos.
2) Identifique defaults de risco que podem gerar comportamento inconsistente.
3) Aponte politicas de configuração para manter previsibilidade entre ambientes.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre diferenciar configuração de aplicação e dependencia de infraestrutura.
- Responda em PT-BR, salvo instrução contrária.
