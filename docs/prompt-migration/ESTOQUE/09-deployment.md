# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Documentar checklist de release de estoque com smoke tests de disponibilidade.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - docs/ESTOQUE.md
  - scripts e jobs que processam movimentação

Pedido

1) Defina checklist pre e pos deploy para evitar inconsistencias de saldo.
2) Liste smoke tests de cardápio e almoxarifado apos release.
3) Descreva estrategia de rollback e reconciliação pos incidente.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Qualquer rollback deve incluir verificacao explícita de impacto em saldos.
- Responda em PT-BR, salvo instrução contrária.
