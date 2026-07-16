# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack FINANCEIRO.
Objetivo: Documentar rotas e contratos HTTP do módulo financeiro.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias: docs/INDEX.md, docs/GUIA_MANUTENCAO_FINANCEIRO.md, docs/DESCONTO_VENDAS.md e start/routes.ts.

Pedido

1) Liste rotas UI/API de financeiro (ex.: /financeiro/vendas, fluxos de fechamento relacionados).
2) Descreva middlewares de acesso e diferenças por perfil.
3) Valide contratos de request/response para desconto, totalização e consulta.
4) Valide consistência de layout da rota `/reports` com o padrão do sistema (sem sidebar placeholder desnecessária).
5) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs utilizados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Quando houver cálculo em endpoint, explicite regra de arredondamento e formato.
- Responda em PT-BR, salvo instrução contrária.
