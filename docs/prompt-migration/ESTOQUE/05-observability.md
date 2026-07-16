# Prompt - Observabilidade

Role: Você está atuando como analista técnico da stack ESTOQUE.
Objetivo: Definir sinais e logs para diagnosticar divergencias e ruptura de estoque.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - logs de movimentação e reconciliação
  - docs/ESTOQUE.md

Pedido

1) Liste eventos observáveis para entrada, baixa e ajuste manual.
2) Defina dados minimos para rastrear divergencia de saldo.
3) Aponte alertas e thresholds para ruptura de itens críticos.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Priorizacao de sinais deve considerar impacto em vendas e atendimento.
- Responda em PT-BR, salvo instrução contrária.
