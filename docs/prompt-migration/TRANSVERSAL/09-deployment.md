# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Documentar checklist de release transversal e validacoes sistêmicas pos deploy.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - Procfile e scripts de operação
  - checklist de validacoes comuns

Pedido

1) Defina checklist global pre e pos deploy para o sistema.
2) Liste smoke tests transversais (auth, logs, formatos, rotas criticas).
3) Descreva rollback padrão e criterio de decisao para ativar rollback.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre priorizar reversibilidade e segurança operacional.
- Responda em PT-BR, salvo instrução contrária.
