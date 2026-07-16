# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack FINANCEIRO.
Objetivo: Documentar checklist de release financeiro com smoke tests de venda e fechamento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - docs/GUIA_MANUTENCAO_FINANCEIRO.md
  - rotas de financeiro para smoke test

Pedido

1) Defina checklist pre e pos deploy para validar integridade financeira.
2) Liste smoke tests de fechamento e conciliacao basica.
3) Descreva plano de rollback com validação de totais pos retorno.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Qualquer rollback deve incluir auditoria minima de dados financeiros afetados.
- Responda em PT-BR, salvo instrução contrária.
