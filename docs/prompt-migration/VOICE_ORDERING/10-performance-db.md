# Prompt - Performance e Banco

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Identificar gargalos de latência, throughput e impacto em banco de dados.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `app/services/pedido_service.ts` — queries de criação de pedido
  - `app/services/insumo_stock_service.ts` — queries de verificação de estoque
  - `app/models/cardapio_produto.ts` — query de cardápio para system prompt

Orçamento de latência

O pipeline de voz tem um orçamento de latência total-alvo de **≤ 5 segundos** (ponta a ponta):

| Etapa                    | Alvo (ms) | Observação                                  |
|--------------------------|-----------|----------------------------------------------|
| Upload do áudio          | ≤ 500     | Depende da conexão do cliente                |
| Whisper transcrição      | ≤ 2000    | Depende do tamanho do áudio e da API         |
| Consulta de cardápio     | ≤ 100     | Query DB local, cacheável                    |
| GPT-4o-mini NLU          | ≤ 1500    | Depende do tamanho do system prompt          |
| Execução da ação         | ≤ 500     | createPedido + reserva de insumos            |
| Serialização da resposta | ≤ 50      | JSON.stringify                               |
| **Total**                | **≤ 4650**| Margem de ~350ms                             |

Otimizações de banco

## Cache de cardápio

A lista de produtos para o system prompt do NLU não precisa ser consultada a cada request:

```typescript
// Cache em memória com TTL de 5 minutos
const menuCache = new Map<number, { data: string; expiresAt: number }>()

async function getMenuForPrompt(empresaId: number): Promise<string> {
  const cached = menuCache.get(empresaId)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const produtos = await CardapioProduto.query()
    .where('empresa_id', empresaId)
    .where('available', true)
    .preload('categoria')
    .orderBy('name')

  const data = produtos.map(p =>
    `ID=${p.id}, Nome="${p.name}", Preço=R$${p.price.toFixed(2)}, Categoria="${p.categoria?.name}"`
  ).join('\n')

  menuCache.set(empresaId, { data, expiresAt: Date.now() + 5 * 60 * 1000 })
  return data
}
```

## Queries críticas

| Query                              | Índice necessário                      | Existe? |
|------------------------------------|----------------------------------------|---------|
| `cardapio_produto WHERE empresa_id AND available` | `idx_cardapio_produto_empresa_available` | Verificar |
| `comanda WHERE empresa_id AND active` | `idx_comanda_empresa_active`          | Verificar |
| `pedido WHERE comanda_id AND status` | `idx_pedido_comanda_status`           | Verificar |

Throughput

- Estimativa: 1-5 requests de voz simultâneos por empresa (tamanho de equipe de atendimento).
- OpenAI rate limits: Tier 1 = 500 RPM para Whisper, 500 RPM para chat completions.
- Bottleneck provável: latência da API OpenAI, não throughput de banco.

Impacto no banco

O módulo de voz não adiciona novas tabelas. As queries adicionais são:

- 1× SELECT de cardápio por request (cacheável)
- 1× SELECT de comandas ativas (cacheável)
- N× INSERTs de pedido/item (mesmo volume do fluxo manual)

Impacto líquido em DB: **negligível** comparado ao fluxo manual.

Pedido

1) Verifique índices existentes em `cardapio_produto`, `comanda` e `pedido`.
2) Meça latência real do Whisper com áudio de 10s e 30s.
3) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Responda em PT-BR, salvo instrução contrária.
