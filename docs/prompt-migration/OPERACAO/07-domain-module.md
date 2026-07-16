# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Descrever regras de negocio de mesas/comandas e estados operacionais.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/MESAS_COMANDAS.md
  - docs/DESCONTO_VENDAS.md
  - services/controllers ligados a abertura, transferencia e fechamento de comandas

Pedido

1) Modele a maquina de estados de mesa/comanda (aberta, em consumo, fechamento, encerrada).
2) Liste invariantes de negocio (não fechar sem itens, controle de desconto, idempotencia de fechamento).
3) Descreva efeitos colaterais em estoque, financeiro e fiscal.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Explicite pre-condicoes e pos-condicoes de cada transicao de estado.
- Responda em PT-BR, salvo instrução contrária.
