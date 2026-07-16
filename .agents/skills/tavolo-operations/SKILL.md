---
name: tavolo-operations
description: "Use when working on mesas, comandas, pedidos, and kitchen workflow."
---

# Tavolo Operations Skill

## Use When
- Modifying table management (mesas) logic
- Working with comandas and order (pedidos) lifecycle
- Changing kitchen kanban or status flows
- Debugging operations UI or backend endpoints

## Critical Files
- `app/models/mesa.ts`
- `app/models/comanda.ts`
- `app/models/pedido.ts`
- `app/models/pedido_item.ts`
- `app/controllers/comandas_controller.ts`
- `app/controllers/pedidos_controller.ts`

## Workflow
1. Verify routes in `start/routes.ts` if adding endpoints.
2. Review model relationships (Mesa -> Comanda -> Pedido).
3. Ensure permission checks are respected.

## Outputs
- Accurate status transitions, correct relationships maintained.
