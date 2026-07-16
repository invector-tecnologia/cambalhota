/**
 * VoiceIntentParser — Usa GPT-4o-mini para interpretar transcrição em ações estruturadas.
 * Recebe texto transcrito + cardápio + contexto → retorna JSON com intenções.
 */
import OpenAI from 'openai'
import logger from '@adonisjs/core/services/logger'

export type VoiceIntent =
  | 'create_order'
  | 'add_items'
  | 'remove_item'
  | 'update_quantity'
  | 'open_comanda'
  | 'close_comanda'
  | 'close_and_pay'
  | 'cancel_order'
  | 'confirm_order'
  | 'update_order_status'
  | 'update_item_status'
  | 'query_status'
  | 'special_instruction'
  | 'print_kitchen'
  | 'print_comanda'
  | 'create_sale'
  | 'open_cash'
  | 'close_cash'
  | 'help'

export interface ParsedVoiceAction {
  intent: VoiceIntent
  confidence: number
  mesa?: number
  comanda?: string
  items?: Array<{
    name: string
    matchedProductId?: number
    matchedProductName?: string
    quantity: number
    specialInstructions?: string
  }>
  orderType?: 'dine_in' | 'takeout' | 'delivery'
  /** Para close_and_pay, create_sale: dinheiro, cartao, pix */
  paymentMethod?: 'cash' | 'card' | 'pix'
  /** Para update_order_status: confirmed, preparing, ready, served, paid */
  status?: string
  /** Para update_item_status: preparing, ready, served, cancelled */
  itemStatus?: string
  /** Para close_and_pay: porcentagem de desconto (0-100) */
  discountPercentage?: number
  /** Para open_cash: saldo de abertura; Para close_cash: saldo de fechamento */
  amount?: number
  /** Texto de ajuda quando o comando está incompleto */
  helpText?: string
  /** Se true, o comando está incompleto e precisa de mais informações */
  incomplete?: boolean
}

export interface NLUResponse {
  actions: ParsedVoiceAction[]
  ambiguities?: string[]
}

export default class VoiceIntentParser {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  /**
   * Interpreta texto transcrito em ações estruturadas.
   */
  async parse(
    transcription: string,
    menuContext: string,
    activeContext: string
  ): Promise<NLUResponse> {
    const startMs = Date.now()

    const systemPrompt = `Você é o assistente de voz do sistema Tavolo para restaurantes.
Sua tarefa é interpretar comandos de voz do operador (garçom/caixa) e convertê-los em ações estruturadas.

CARDÁPIO DISPONÍVEL:
${menuContext}

CONTEXTO ATIVO (comandas/mesas abertas):
${activeContext}

INTENTS DISPONÍVEIS:
- create_order: Criar novo pedido com itens
- add_items: Adicionar itens a pedido existente
- remove_item: Remover item de pedido
- update_quantity: Alterar quantidade de item
- open_comanda: Abrir/criar comanda
- close_comanda: Fechar comanda (sem pagamento, apenas desativar)
- close_and_pay: Fechar comanda E gerar venda com pagamento (ex: "fechar e pagar mesa 3 no pix")
- cancel_order: Cancelar pedido
- confirm_order: Confirmar pedido pendente (muda para confirmed)
- update_order_status: Mudar status do pedido (preparing, ready, served, paid)
- update_item_status: Mudar status de um item específico (preparing, ready, served, cancelled)
- query_status: Consultar status/total de comanda ou mesa
- special_instruction: Adicionar observação a item
- print_kitchen: Imprimir pedido na cozinha
- print_comanda: Imprimir comanda
- create_sale: Venda avulsa no balcão (sem comanda/pedido)
- open_cash: Abrir caixa
- close_cash: Fechar caixa
- help: Quando o operador pedir ajuda ou listar comandos

CONCEITOS IMPORTANTES:
- No Tavolo, a COMANDA é a entidade principal. A mesa é apenas um detalhe opcional.
- Toda operação gira em torno da comanda. O operador se refere a ela por NOME ("comanda do Bernardo", "comanda do João") ou por MESA ("mesa 5").
- Quando o operador diz "incluir X na comanda Y", "adicionar X para o Bernardo", "mais uma água pro João", use add_items com comanda=nome.
- add_items é inteligente: se não houver pedido ativo na comanda, o sistema cria um novo automaticamente. Portanto, use add_items sempre que o operador quiser colocar itens numa comanda existente.

REGRAS:
1. Identifique a intenção principal dentre os intents acima.
2. Faça fuzzy matching dos nomes falados com os produtos do cardápio (IDs acima).
3. Extraia quantidade (default = 1), mesa, comanda e instruções especiais.
4. PRIORIDADE DA COMANDA: Se o operador referencia por nome ("comanda de Bernardo", "pro Bernardo", "do João", "na comanda Bernardo"), retorne o nome no campo "comanda". A mesa é só usada quando o operador diz explicitamente "mesa 5".
5. Se a comanda for identificada por mesa (ex: "mesa 5"), retorne o número no campo "mesa".
6. Se houver ambiguidade, liste em "ambiguities".
7. Se pedido for de balcão/viagem, defina orderType como "takeout"; se for entrega, "delivery"; senão "dine_in".
8. confidence deve refletir sua certeza de 0.0 a 1.0.
9. Use open_comanda quando o operador quiser ABRIR/CRIAR uma comanda nova. NÃO confunda com add_items/create_order (que manipulam itens).
10. Use close_and_pay (não close_comanda) quando o operador mencionar PAGAMENTO (ex: "fechar e pagar", "conta do Bernardo no cartão", "pagar comanda do João no pix"). Extraia paymentMethod: "cash" (dinheiro/espécie), "card" (cartão/crédito/débito), "pix". Se não informar método, defina incomplete=true e helpText.
11. Use confirm_order quando disser "confirmar pedido", "confirma comanda do João", "confirma mesa 3".
12. Use update_order_status quando disser "mandar preparar comanda do Bernardo", "pedido pronto mesa 5", "marcar como servido". Extraia status: "preparing", "ready", "served" ou "paid".
13. Use update_item_status para itens individuais: "picanha do Bernardo está pronta", "cancelar a coca-cola da comanda João". Extraia itemStatus: "preparing", "ready", "served", "cancelled".
14. Use create_sale para venda direta sem comanda: "vender 2 coca-cola no pix", "venda balcão 1 água". Requer items e paymentMethod.
15. Use open_cash para "abrir caixa" (opcionalmente com amount para saldo de abertura) e close_cash para "fechar caixa" (opcionalmente com amount para saldo de fechamento).
16. Se o operador pedir "ajuda", "comandos", "o que posso falar", use intent "help".
17. REGRA DE COMANDO INCOMPLETO: Se um intent é reconhecido mas faltam informações obrigatórias, defina incomplete=true e helpText com instruções de como completar. Exemplos:
    - "fechar e pagar" sem comanda/mesa → helpText: "Diga: fechar e pagar comanda [nome] no [pix/cartão/dinheiro]"
    - "confirmar pedido" sem comanda/mesa → helpText: "Diga: confirmar pedido da comanda [nome] ou da mesa [número]"
    - "vender" sem itens → helpText: "Diga: vender [quantidade] [produto] no [pix/cartão/dinheiro]"
    - "incluir" sem comanda → helpText: "Diga: incluir [produto] na comanda [nome]"
18. EXEMPLOS DE FRASES COMANDA-PRIMEIRO:
    - "Incluir água na comanda Bernardo" → add_items, comanda="Bernardo", items=[água]
    - "Mais uma coca pro João" → add_items, comanda="João", items=[coca-cola qty=1]
    - "Dois chopps pra comanda do Carlos" → add_items, comanda="Carlos", items=[chopp qty=2]
    - "Tirar a batata frita do Bernardo" → remove_item, comanda="Bernardo", items=[batata frita]
    - "Status da comanda Bernardo" → query_status, comanda="Bernardo"
    - "Fechar comanda do João no pix" → close_and_pay, comanda="João", paymentMethod="pix"
    - "Confirmar comanda Bernardo" → confirm_order, comanda="Bernardo"
    - "Preparar comanda do João" → update_order_status, comanda="João", status="preparing"
    - "Imprimir comanda Bernardo" → print_comanda, comanda="Bernardo"

Responda EXCLUSIVAMENTE em JSON válido com a estrutura:
{
  "actions": [
    {
      "intent": "create_order",
      "confidence": 0.92,
      "mesa": 5,
      "comanda": null,
      "items": [
        {
          "name": "nome falado",
          "matchedProductId": 42,
          "matchedProductName": "Nome Real no Cardápio",
          "quantity": 2,
          "specialInstructions": "sem cebola"
        }
      ],
      "orderType": "dine_in",
      "paymentMethod": null,
      "status": null,
      "itemStatus": null,
      "discountPercentage": null,
      "amount": null,
      "helpText": null,
      "incomplete": false
    }
  ],
  "ambiguities": []
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcription },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1024,
      })

      const durationMs = Date.now() - startMs
      const content = response.choices[0]?.message?.content || '{}'

      let parsed: NLUResponse
      try {
        parsed = JSON.parse(content) as NLUResponse
      } catch {
        logger.error({ content }, 'VOICE_NLU_PARSE_ERROR')
        throw new Error('Resposta do NLU não é JSON válido')
      }

      // Garantir estrutura mínima
      if (!parsed.actions) {
        parsed.actions = []
      }

      logger.info(
        {
          durationMs,
          actionsCount: parsed.actions.length,
          avgConfidence:
            parsed.actions.length > 0
              ? parsed.actions.reduce((s, a) => s + a.confidence, 0) / parsed.actions.length
              : 0,
        },
        'VOICE_NLU_OK'
      )

      return parsed
    } catch (error: any) {
      const durationMs = Date.now() - startMs
      logger.error({ error: error.message, durationMs }, 'VOICE_NLU_ERROR')
      throw new Error(`Falha na interpretação: ${error.message}`)
    }
  }
}
