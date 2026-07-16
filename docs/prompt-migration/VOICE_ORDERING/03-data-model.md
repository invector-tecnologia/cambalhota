# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Identificar entidades, relações e contratos de dados do módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `app/models/pedido.ts` — campos: empresaId, comandaId, userId, orderNumber, type, status, items
  - `app/models/pedido_item.ts` — campos: pedidoId, cardapioProdutoId, itemName, quantity, unitPrice, specialInstructions
  - `app/models/comanda.ts` — campos: empresaId, mesaId, number, name, active
  - `app/models/cardapio_produto.ts` — campos: empresaId, categoriaId, name, price, available
  - `app/models/cardapio_categoria.ts` — campos: empresaId, name, active, sortOrder
  - `app/services/pedido_service.ts` — interface `PedidoCreateData`

Entidades existentes reutilizadas (sem alteração)

O módulo de voz opera sobre as entidades existentes de pedido/comanda:

```text
CardapioCategoria (1) ──── (N) CardapioProduto
                                    │
Comanda (1) ──── (N) Pedido (1) ──── (N) PedidoItem ──── (1) CardapioProduto
   │                    │
Mesa (1) ──── (N)       User (quem criou)
```

Entidade nova — VoiceConfig (BYOK)

O módulo cria uma nova tabela `voice_configs` para armazenar a API key OpenAI por empresa (modelo BYOK). Padrão de referência: `fiscal_configs`.

```text
Empresa (1) ──── (0..1) VoiceConfig
                              │
                              ├── openaiApiKey (criptografada AES-256-GCM)
                              ├── enabled (boolean)
                              ├── whisperModel (override opcional)
                              └── llmModel (override opcional)
```

```typescript
// Migration: create_voice_configs
// Tabela: voice_configs
{
  id:              number        // PK auto-increment
  empresa_id:      number        // FK → empresas.id (unique)
  openai_api_key:  string        // Criptografada com APP_KEY
  enabled:         boolean       // Default false
  whisper_model:   string | null // Override do default do servidor
  llm_model:       string | null // Override do default do servidor
  created_at:      DateTime
  updated_at:      DateTime
}
```

Contratos de dados do pipeline de voz

## 1. Request: Frontend → Backend

```typescript
// POST /api/voice/process
// Content-Type: multipart/form-data
interface VoiceProcessRequest {
  audio: File              // Blob de áudio (webm, ogg, mp3, wav) ≤ 25MB
  comandaId?: number       // Comanda ativa no contexto do operador
  mesaId?: number          // Mesa ativa no contexto
  sessionContext?: string  // JSON serializado com pedido aberto, se houver
}
```

## 2. Whisper Response (interno)

```typescript
interface WhisperTranscription {
  text: string           // "dois x-burger sem cebola pra mesa cinco"
  language: string       // "pt"
  duration: number       // segundos de áudio
}
```

## 3. NLU Response (interno — JSON do GPT-4o-mini)

```typescript
type VoiceIntent =
  | 'create_order'       // Criar pedido novo
  | 'add_items'          // Adicionar itens a pedido existente
  | 'remove_item'        // Remover item
  | 'update_quantity'    // Alterar quantidade
  | 'close_comanda'      // Fechar comanda
  | 'cancel_order'       // Cancelar pedido
  | 'query_status'       // Consultar total / status
  | 'special_instruction' // Ajustar instrução especial

interface ParsedVoiceAction {
  intent: VoiceIntent
  confidence: number     // 0.0 – 1.0
  mesa?: number          // número da mesa (extraído de "mesa 5")
  comanda?: string       // número ou nome da comanda
  items?: Array<{
    name: string                   // nome falado ("x-burger")
    matchedProductId?: number      // ID resolvido por fuzzy matching
    matchedProductName?: string    // nome real do cardápio
    quantity: number               // default 1
    specialInstructions?: string   // "sem cebola"
  }>
  orderType?: 'dine_in' | 'takeout' | 'delivery'
}

interface NLUResponse {
  actions: ParsedVoiceAction[]
  ambiguities?: string[]   // casos que precisam confirmação do operador
}
```

## 4. Response: Backend → Frontend

```typescript
interface VoiceProcessResponse {
  transcript: string                   // texto transcrito pelo Whisper
  actions: ParsedVoiceAction[]         // ações interpretadas
  results: Array<{
    actionIndex: number
    success: boolean
    pedidoId?: number
    orderNumber?: string
    error?: string
  }>
  feedback: string                     // frase amigável para TTS ou exibição
  requiresConfirmation?: boolean       // true se houver ambiguidades
  ambiguities?: string[]               // perguntas para o operador
}
```

Mapping NLU → PedidoService

| Intent             | Dado requerido                          | Chamada no backend                                    |
|--------------------|-----------------------------------------|-------------------------------------------------------|
| create_order       | items[].matchedProductId, quantity, mesa | `PedidoService.createPedido(data, user, logger, tz)` |
| add_items          | pedidoId (do contexto), items            | `pedido.addItem(productId, qty, instructions)`        |
| remove_item        | pedidoId, itemName ou productId          | `PedidoItem.query().where(...).delete()`              |
| update_quantity    | pedidoId, productId, newQty              | `PedidoItem.merge({ quantity })`                      |
| close_comanda      | comandaId                                | `ComandaCloseService.close(comanda, user)`            |
| cancel_order       | pedidoId                                | `pedido.merge({ status: 'cancelled' })`               |
| query_status       | comandaId ou mesaId                      | Leitura e retorno de totais                           |

Pedido

1) Confirme que `PedidoCreateData` em `pedido_service.ts` aceita todos os campos que o NLU pode gerar.
2) Verifique se `cardapio_produto.name` é suficiente para fuzzy matching ou se precisa de aliases/sinônimos.
3) Identifique se existe campo de "apelido" ou "nome curto" nos produtos do cardápio.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- O módulo de voz cria apenas uma tabela nova (`voice_configs`) para o modelo BYOK.
- As demais entidades (pedido, comanda, cardápio) são consumidas sem alteração.
- A `openai_api_key` é criptografada em repouso e nunca logada ou exposta em responses.
- Responda em PT-BR, salvo instrução contrária.
