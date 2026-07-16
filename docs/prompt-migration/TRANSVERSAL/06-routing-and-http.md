# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Documentar padrões HTTP transversais e convenções de rota aplicadas no sistema.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/INDEX.md
  - start/routes.ts
  - middleware globais e validators comuns
  - docs/TIMEZONE_USUARIO.md e docs/formatacao-numerica.md

Pedido

1) Mapeie convenções de naming, versionamento e agrupamento de rotas.
2) Descreva padrões de auth, tratamento de erro e serializacao de resposta.
3) Aponte pontos onde formato de data/hora/numero deve ser padronizado.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre destacar padrões reutilizaveis que devem ser aplicados em novas rotas.
- Responda em PT-BR, salvo instrução contrária.
