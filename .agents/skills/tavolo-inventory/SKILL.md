---
name: tavolo-inventory
description: "Use when working on insumos, reservas, stock logic, and NFe import."
---

# Tavolo Inventory Skill

## Use When
- Modifying stock (almoxarifado) tracking or deduction logic
- Working with recipes (cardapio_produtos_ingredientes)
- Handling NFe import for stock replenishment
- Debugging stock reservations

## Critical Files
- `app/models/insumo.ts`
- `app/models/insumo_reserva.ts`
- `app/models/cardapio_produto_ingrediente.ts`
- `app/services/stock_service.ts` (if exists)

## Workflow
1. Remember that stock is usually deducted when a Comanda is closed or a Venda is finalized.
2. Check `InsumoReserva` to handle pending orders without immediately deducting stock.
3. Validate minimum thresholds.

## Outputs
- Accurate inventory levels and consistent reservation states.
