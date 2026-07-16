# Prompt - Diagnóstico de Performance

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Definir processo de RCA para lentidao no atendimento e atraso de notificacoes.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - incidentes de suporte e SLA
  - consultas criticas de tickets/mensagens

Pedido

1) Defina checklist de diagnóstico para atraso de resposta e perda de notificacao.
2) Liste sinais para diferenciar problema de fila, banco e camada HTTP.
3) Estruture mitigacao imediata e plano de prevencao.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- No RCA, registrar impacto de SLA e quantidade de tickets afetados.
- Responda em PT-BR, salvo instrução contrária.
