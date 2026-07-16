# Prompt - Observabilidade

Role: Você está atuando como analista técnico da stack ADMIN.
Objetivo: Definir sinais e logs para rastrear ações administrativas e incidentes operacionais.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - logs de controllers e services administrativos
  - docs/ADMIN_ASSINATURAS_SUPORTE.md

Pedido

1) Liste eventos auditaveis de alto impacto (deleção, alteração de status, suporte).
2) Defina campos minimos para trilha de auditoria por ator.
3) Aponte alertas para operações anormais ou em massa.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Priorizacao deve focar risco de segurança e impacto em dados críticos.
- Responda em PT-BR, salvo instrução contrária.
