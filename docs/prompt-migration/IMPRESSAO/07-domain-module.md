# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack IMPRESSAO.
Objetivo: Descrever regras de negocio de geração, envio e confirmacao de impressao.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/MODULO_IMPRESSAO_NOTAS.md
  - services de impressao e controllers relacionados
  - docs/LOGGING.md

Pedido

1) Modele o ciclo de impressao (preparar, enviar, confirmar, falhar/repetir).
2) Liste invariantes (não imprimir documento invalido, rastreabilidade por pedido/documento).
3) Explique estrategia de retry e observabilidade de falhas.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Sempre separar regras de negocio de detalhes de dispositivo/infra.
- Responda em PT-BR, salvo instrução contrária.
