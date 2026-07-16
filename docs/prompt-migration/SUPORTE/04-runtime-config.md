# Prompt - Configuração de Runtime

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Mapear configuracoes de runtime que impactam fluxo e notificacoes de suporte.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/SUPORTE_TICKETS_CICLO.md
  - config/*.ts e settings de notificacao/sessao
  - docs/DEPLOYMENT.md

Pedido

1) Liste configuracoes que afetam disponibilidade do canal de suporte.
2) Identifique defaults de risco para notificacao e expiracao de sessao.
3) Aponte efeitos de configuração incorreta no ciclo de atendimento.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Priorizar impacto em tempo de resposta e continuidade da conversa.
- Responda em PT-BR, salvo instrução contrária.
