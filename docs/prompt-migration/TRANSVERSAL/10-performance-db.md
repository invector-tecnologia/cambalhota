# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Identificar gargalos sistêmicos recorrentes de performance em banco e aplicação.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/LOGGING.md
  - consultas/transacoes frequentes em modulos centrais
  - docs/REPROCESSAMENTO.md

Pedido

1) Liste padrões de gargalo que se repetem entre stacks.
2) Aponte riscos de saturacao por consultas, locks ou processamento em lote.
3) Proponha estrategia de medicao comparavel entre modulos.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Evitar conclusoes de tuning sem indicador objetivo associado.
- Responda em PT-BR, salvo instrução contrária.
