# Prompt - Observabilidade

Role: Você está atuando como analista técnico da stack REPROCESSAMENTO.
Objetivo: Definir sinais e logs para diagnosticar filas, retries e falhas definitivas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - docs/REPROCESSAMENTO.md
  - logs de jobs e comandos administrativos

Pedido

1) Liste eventos observáveis por ciclo de retry.
2) Defina metricas para backlog, sucesso, falha e tempo de drenagem.
3) Aponte alertas para identificar degradação antes de impacto amplo.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Separar sinal de erro transitorio e erro permanente na análise.
- Responda em PT-BR, salvo instrução contrária.
