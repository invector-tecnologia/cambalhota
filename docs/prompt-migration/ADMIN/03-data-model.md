# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack ADMIN.
Objetivo: Identificar entidades administrativas e campos críticos de governanca e status.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/ADMIN_ASSINATURAS_SUPORTE.md
  - models/migrations de empresas, assinaturas e suporte
  - app/services/empresa_deletion_service.ts

Pedido

1) Liste entidades e relacoes usadas em governanca administrativa.
2) Destaque campos de status, ciclo de vida e responsabilidade.
3) Aponte riscos de inconsistência entre status administrativo e operacional.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre sinalizar dados sensiveis e necessidade de rastreabilidade.
- Responda em PT-BR, salvo instrução contrária.
