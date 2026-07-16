# Prompt - Configuração de Runtime

Role: Você está atuando como analista técnico da stack ADMIN.
Objetivo: Mapear configuracoes de runtime que afetam painel admin e operações criticas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - config/*.ts e variaveis ligadas a auth/permissoes
  - scripts administrativos do projeto

Pedido

1) Liste configuracoes que impactam acesso e ações administrativas.
2) Identifique defaults perigosos para operações destrutivas.
3) Aponte mitigacoes de configuração para reduzir risco de erro humano.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre explicitar se a configuração tem impacto multiempresa.
- Responda em PT-BR, salvo instrução contrária.
