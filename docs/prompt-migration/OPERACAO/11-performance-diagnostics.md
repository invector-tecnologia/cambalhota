# Prompt - Diagnóstico de Performance

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Definir processo de RCA para lentidao e falhas no atendimento operacional.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - histórico de incidentes e comandos de debug
  - rotas criticas de operação em start/routes.ts

Pedido

1) Defina checklist de diagnóstico para erros em abertura, consumo e fechamento.
2) Liste sinais de saturacao e como confirmar causa raiz.
3) Estruture plano de mitigacao imediata e ação corretiva permanente.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Diferencie claramente mitigacao de curto prazo e correcao estrutural.
- Responda em PT-BR, salvo instrução contrária.
