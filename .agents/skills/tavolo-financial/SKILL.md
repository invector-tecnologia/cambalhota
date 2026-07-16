---
name: tavolo-financial
description: "Use when working on vendas, caixa, reports, and discount logic."
---

# Tavolo Financial Skill

## Use When
- Modifying Vendas (sales) and Caixa (cash register) flows
- Changing payment methods or split payments
- Updating financial reports and profitability calculations
- Adjusting discount logic at comanda or item level

## Critical Files
- `app/models/venda.ts`
- `app/models/caixa_registro.ts`
- `app/controllers/vendas_controller.ts`
- `app/controllers/caixa_registros_controller.ts`

## Workflow
1. Ensure all financial calculations use precise decimal arithmetic.
2. Validate that Venda totals match Pedido/Comanda totals minus discounts.
3. Check Caixa state (open/closed) before allowing Venda operations.

## Outputs
- Consistent financial records, no rounding errors.
