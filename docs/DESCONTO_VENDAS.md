# Desconto em vendas

## Objetivo

Padronizar como o desconto percentual e aplicado no fechamento da comanda e refletido nas vendas.

## Rotas relacionadas

- UI: /comandas/:id (fechar e pagar)
- UI: /financeiro/vendas

## Regras de negocio

- Desconto e percentual (0 a 100).
- Valor do desconto = (subtotal * descontoPercentual) / 100.
- Total = subtotal - desconto + taxa.
- Percentual invalido retorna erro de validacao.

## Onde aplicar

- Fechamento da comanda: valida e salva o desconto na venda gerada.
- Tela de vendas: exibe subtotal, desconto, taxa e total com padrao visual.

## Testes

- Unidade: tests/unit/venda_discount.spec.ts
- Fluxo: fechamento de comanda com desconto e taxa.

## Checklist rapido

- Desconto >= 0 e <= 100.
- Total calculado com a formula padrao.
- Valores formatados com helpers de moeda.
