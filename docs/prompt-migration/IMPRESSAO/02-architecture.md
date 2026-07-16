# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack IMPRESSAO.
Objetivo: Mapear arquitetura de configuração e execucao de impressao de notas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/MODULO_IMPRESSAO_NOTAS.md
  - controllers/services de impressao
  - rotas admin de configuração de impressao

Pedido

1) Descreva fluxo arquitetural de preparar, enviar e confirmar impressao.
2) Identifique fronteiras entre configuração administrativa e ação operacional.
3) Aponte dependencias externas e riscos de indisponibilidade.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Separar claramente camada de negocio e camada de integração de dispositivo.
- Responda em PT-BR, salvo instrução contrária.
