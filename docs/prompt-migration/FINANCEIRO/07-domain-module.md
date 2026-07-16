# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack FINANCEIRO.
Objetivo: Descrever regras de negocio de valores, descontos, totais e conciliacao.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/GUIA_MANUTENCAO_FINANCEIRO.md
  - docs/DESCONTO_VENDAS.md
  - docs/formatacao-numerica.md
  - services/validators de vendas e fechamento

Pedido

1) Descreva regras de composicao de total (subtotal, descontos, acrescimos, total final).
2) Liste limites e politicas de desconto por contexto de venda.
3) Explique como evitar inconsistencias em ajustes manuais e reprocessamentos.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Se houver regra numerica, explicite unidade, escala e criterio de arredondamento.
- Responda em PT-BR, salvo instrução contrária.
