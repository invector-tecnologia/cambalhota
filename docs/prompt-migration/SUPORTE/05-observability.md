# Prompt - Observabilidade

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Definir sinais e logs para diagnosticar backlog e qualidade do atendimento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - docs/SUPORTE_TICKETS_CICLO.md
  - logs dos controladores e service de tickets

Pedido

1) Liste eventos observáveis de abertura, resposta e resolução.
2) Defina metricas para backlog, tempo de primeira resposta e resolução.
3) Aponte alertas para tickets sem resposta e auto-resolução recorrente.
4) Inclua sinais de UX operacional do indicador de disponibilidade (**Suporte online/offline**) e impacto em atendimento.
5) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Em observabilidade, diferenciar sinal de qualidade de atendimento e sinal técnico.
- Responda em PT-BR, salvo instrução contrária.
