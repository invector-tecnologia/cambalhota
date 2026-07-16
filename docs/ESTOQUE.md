# Estoque e reserva de insumos

## Objetivo

Documentar o fluxo de reserva, deducao e liberacao de insumos ligado a pedidos.

## Rotas relacionadas

- UI: /cardapio/produtos
- UI: /almoxarifado/insumos
- UI: /almoxarifado/nfes

## Fluxo resumido

1. Pedido criado: reserva insumos (estoque fisico nao muda).
2. Pedido em preparo: debita insumos do estoque.
3. Pedido pronto/servido: sem impacto adicional.
4. Pedido cancelado:
   - Antes de preparar: libera reserva.
   - Depois de preparar: nao devolve ao estoque.

## UI e disponibilidade

- Listagem de produtos exibe maximo possivel.
- Status de disponibilidade usa o calculo de maximo possivel.

## Pontos de atencao

- Reserva evita overbooking de insumos.
- Deducao ocorre apenas uma vez ao entrar em preparo.

## Testes

- Unidade: tests/unit/insumo_stock_logic.spec.ts
