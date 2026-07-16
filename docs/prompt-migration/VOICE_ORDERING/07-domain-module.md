# Prompt - Fluxo de Domínio

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Descrever regras de negócio, máquina de estados e invariantes do módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `app/services/pedido_service.ts` — `PedidoCreateData`, `createPedido`, `updatePedido`
  - `app/services/comanda_close_service.ts` — fechamento de comanda
  - `app/services/insumo_stock_service.ts` — verificação de disponibilidade
  - `app/models/cardapio_produto.ts` — `getMaxPrepareQuantity()`
  - `docs/MESAS_COMANDAS.md`, `docs/DESCONTO_VENDAS.md`

Intenções suportadas (enum VoiceIntent)

```text
create_order        → Criar pedido novo com 1+ itens
add_items           → Adicionar itens a pedido/comanda existente
remove_item         → Remover item de pedido aberto
update_quantity     → Alterar quantidade de item existente
close_comanda       → Fechar comanda (gera venda/pagamento)
cancel_order        → Cancelar pedido
query_status        → Consultar total / itens de mesa ou comanda
special_instruction → Adicionar/alterar observação de item
```

Fluxo de processamento por intenção

## create_order

```text
Pré-condições:
  - Operador autenticado com empresaId válido
  - Mesa/comanda identificada (por número falado ou contexto)
  - Pelo menos 1 item com match no cardápio
  - Item disponível (insumo_stock_service.checkProductAvailability)

Processamento:
  1. Resolver mesa → comanda ativa (ou criar comanda se não existir)
  2. Para cada item: fuzzy match nome falado → cardapio_produto.name
  3. Verificar disponibilidade de insumos por item
  4. Chamar PedidoService.createPedido(data, user, logger, timezone)
  5. Retornar pedidoId e orderNumber

Pós-condições:
  - Pedido criado com status 'pending'
  - Insumos reservados (insumo_stock_service.reserveInsumoFromOrder)
  - Log VOICE_ACTION_EXECUTED emitido
```

## add_items

```text
Pré-condições:
  - Pedido aberto identificado (via pedidoId no contexto ou último pedido da mesa)
  - Item com match no cardápio

Processamento:
  1. Localizar pedido ativo da comanda/mesa
  2. Fuzzy match do item
  3. Chamar pedido.addItem(productId, quantity, instructions)

Pós-condições:
  - PedidoItem criado
  - Totais recalculados (pedido.calculateTotals)
```

## close_comanda

```text
Pré-condições:
  - Comanda identificada e ativa
  - Todos os pedidos da comanda em status 'completed' ou 'cancelled'

Processamento:
  1. Chamar ComandaCloseService.close(comanda, user)
  2. Gerar venda e itens de venda
  3. Se fiscal habilitado, emitir NFC-e

Pós-condições:
  - Comanda.active = false
  - Venda criada com itens consolidados
```

Resolução de ambiguidades

O NLU pode encontrar ambiguidades que exigem confirmação do operador:

| Ambiguidade                          | Estratégia                                           |
|--------------------------------------|-------------------------------------------------------|
| Múltiplos itens com nome similar     | Retornar `requiresConfirmation: true` com opções      |
| Mesa não identificada                | Usar mesa do contexto atual; se ausente, perguntar    |
| Item indisponível                    | Informar e sugerir alternativas (mesma categoria)     |
| Quantidade zero ou negativa          | Rejeitar com `VOICE_ACTION_REJECTED`                  |
| Confiança abaixo do threshold        | Retornar transcrição + interpretação para confirmação |

Fuzzy matching de produtos

O system prompt do GPT-4o-mini recebe a lista de produtos ativos da empresa:

```text
Cardápio disponível:
ID=42, Nome="X-Burger Artesanal", Preço=R$28.90, Categoria="Lanches"
ID=43, Nome="X-Salada", Preço=R$25.90, Categoria="Lanches"
ID=44, Nome="Coca-Cola 350ml", Preço=R$7.00, Categoria="Bebidas"
...
```

O LLM faz o matching semântico (ex: "coca" → "Coca-Cola 350ml", "burger" → "X-Burger Artesanal").

Invariantes

- O módulo de voz NUNCA cria itens fora do cardápio — apenas referencia `cardapioProdutoId` existente.
- O módulo de voz NUNCA ultrapassa a disponibilidade de insumos — verifica antes de executar.
- O módulo de voz SEGUE as mesmas regras de desconto e taxa de serviço que o fluxo manual.
- Ações destrutivas (cancelar pedido, fechar comanda) exigem `confidence >= 0.85`.

Pedido

1) Verifique se `Comanda` tem método para encontrar o último pedido ativo.
2) Confirme a existência de `pedido.addItem` em `app/models/pedido.ts`.
3) Mapeie edge cases: mesa sem comanda ativa, comanda sem pedidos.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Responda em PT-BR, salvo instrução contrária.
