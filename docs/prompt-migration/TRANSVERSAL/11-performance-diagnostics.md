# Prompt - Diagnóstico de Performance

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Definir processo de RCA transversal para incidentes de performance em multiplas stacks.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - incidentes historicos relevantes
  - guias de debug/performance existentes

Pedido

1) Defina checklist de RCA padrão para qualquer incidente de performance.
2) Liste sinais para diferenciar causa local e causa sistêmica.
3) Estruture plano de mitigacao, prevencao e padronizacao de aprendizado.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Em RCA transversal, sempre registrar dependencias entre modulos afetados.
- Responda em PT-BR, salvo instrução contrária.
