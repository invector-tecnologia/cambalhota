# Prompt - Diagnóstico de Performance

Role: Você está atuando como analista técnico da stack ADMIN.
Objetivo: Definir processo de RCA para degradacao de painel admin e ações sensiveis lentas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - incidentes administrativos historicos
  - consultas e comandos críticos do admin

Pedido

1) Defina checklist de diagnóstico para lentidao e erro em operações admin.
2) Liste sinais para diferenciar problema de permissao, dado ou infraestrutura.
3) Estruture mitigacao imediata e plano corretivo de longo prazo.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- No RCA, registrar impacto por tenant e reversibilidade da ação.
- Responda em PT-BR, salvo instrução contrária.
