/**
 * VoiceOrderingService — Orquestra o pipeline completo: STT → NLU → Execução.
 * Este é o ponto de entrada chamado pelo controller.
 */
import VoiceTranscriber from './voice_transcriber.js'
import VoiceIntentParser from './voice_intent_parser.js'
import VoiceActionExecutor from './voice_action_executor.js'
import type { ActionResult } from './voice_action_executor.js'
import type { ParsedVoiceAction, NLUResponse } from './voice_intent_parser.js'
import VoiceConfig from '#models/voice_config'
import CardapioProduto from '#models/cardapio_produto'
import Comanda from '#models/comanda'
import voiceConfig from '#config/voice'
import logger from '@adonisjs/core/services/logger'

export interface VoiceProcessResult {
  transcript: string
  actions: ParsedVoiceAction[]
  results: ActionResult[]
  feedback: string
  requiresConfirmation: boolean
  ambiguities: string[]
  totalDurationMs: number
}

export interface VoicePreviewResult {
  transcript: string
  actions: ParsedVoiceAction[]
  feedback: string
  requiresConfirmation: boolean
  ambiguities: string[]
  totalDurationMs: number
}

export default class VoiceOrderingService {
  /**
   * Fase 1: Transcreve e interpreta (para preview/confirmação do usuário).
   * NÃO executa ações — apenas retorna o que seria feito.
   */
  static async preview(
    audioBuffer: Buffer,
    filename: string,
    empresaId: number
  ): Promise<VoicePreviewResult> {
    const startMs = Date.now()

    // Resolver config BYOK da empresa
    const config = await this.getEmpresaConfig(empresaId)
    const apiKey = config.getApiKey()
    const whisperModel = config.whisperModel || voiceConfig.whisperModel
    const llmModel = config.llmModel || voiceConfig.llmModel

    // Etapa 1: STT
    const transcriber = new VoiceTranscriber(apiKey, whisperModel)
    const transcription = await transcriber.transcribe(audioBuffer, filename)

    if (!transcription.text.trim()) {
      return {
        transcript: '',
        actions: [],
        feedback: 'Não consegui entender o áudio. Tente falar mais perto do microfone.',
        requiresConfirmation: false,
        ambiguities: [],
        totalDurationMs: Date.now() - startMs,
      }
    }

    // Etapa 2: Construir contexto
    const menuContext = await this.buildMenuContext(empresaId)
    const activeContext = await this.buildActiveContext(empresaId)

    // Etapa 3: NLU
    const parser = new VoiceIntentParser(apiKey, llmModel)
    const nluResult = await parser.parse(transcription.text, menuContext, activeContext)

    const requiresConfirmation =
      (nluResult.ambiguities && nluResult.ambiguities.length > 0) ||
      nluResult.actions.some((a) => a.confidence < voiceConfig.confidenceThreshold)

    // Build feedback descritivo para o usuário confirmar
    const feedback = this.buildPreviewFeedback(nluResult)

    return {
      transcript: transcription.text,
      actions: nluResult.actions,
      feedback,
      requiresConfirmation: requiresConfirmation || true, // sempre confirmar
      ambiguities: nluResult.ambiguities || [],
      totalDurationMs: Date.now() - startMs,
    }
  }

  /**
   * Fase 2: Executa as ações confirmadas pelo usuário.
   */
  static async execute(
    actions: ParsedVoiceAction[],
    empresaId: number,
    user: any,
    timezone?: string
  ): Promise<VoiceProcessResult> {
    const startMs = Date.now()

    const executor = new VoiceActionExecutor(empresaId, user, timezone)
    const results: ActionResult[] = []

    for (const [i, action] of actions.entries()) {
      const result = await executor.execute(action, i)
      results.push(result)
    }

    const feedbacks = results.map((r) => r.feedback).join(' ')

    const totalDurationMs = Date.now() - startMs
    logger.info(
      {
        actionsCount: actions.length,
        successCount: results.filter((r) => r.success).length,
        totalDurationMs,
      },
      'VOICE_PROCESS_COMPLETE'
    )

    return {
      transcript: '',
      actions,
      results,
      feedback: feedbacks,
      requiresConfirmation: false,
      ambiguities: [],
      totalDurationMs,
    }
  }

  /**
   * Obtém VoiceConfig da empresa (BYOK).
   */
  private static async getEmpresaConfig(empresaId: number): Promise<VoiceConfig> {
    const config = await VoiceConfig.query()
      .where('empresa_id', empresaId)
      .where('enabled', true)
      .first()

    if (!config) {
      throw new Error(
        'Módulo de voz não configurado. Acesse Configurações > Voz para configurar sua API key.'
      )
    }

    return config
  }

  /**
   * Constrói contexto do cardápio para o system prompt do NLU.
   */
  private static async buildMenuContext(empresaId: number): Promise<string> {
    const produtos = await CardapioProduto.query()
      .where('empresa_id', empresaId)
      .where('available', true)
      .where('active', true)
      .preload('cardapioCategoria')
      .orderBy('name')

    if (produtos.length === 0) {
      return 'Nenhum produto disponível no cardápio.'
    }

    return produtos
      .map(
        (p) =>
          `ID=${p.id}, Nome="${p.name}", Preço=R$${Number(p.salePrice).toFixed(2)}, Categoria="${p.cardapioCategoria?.name || 'Sem categoria'}"`
      )
      .join('\n')
  }

  /**
   * Constrói contexto de comandas/mesas ativas.
   */
  private static async buildActiveContext(empresaId: number): Promise<string> {
    const comandas = await Comanda.query()
      .where('empresa_id', empresaId)
      .where('active', true)
      .preload('mesa')

    if (comandas.length === 0) {
      return 'Nenhuma comanda ativa no momento.'
    }

    return comandas
      .map((c) => {
        const mesa = c.mesa ? `Mesa ${c.mesa.number}` : 'Sem mesa'
        const name = c.name || `Comanda ${c.number}`
        return `Comanda ID=${c.id}, Nome="${name}", ${mesa}`
      })
      .join('\n')
  }

  /**
   * Constrói feedback descritivo para a tela de preview.
   */
  private static buildPreviewFeedback(nlu: NLUResponse): string {
    if (nlu.actions.length === 0) {
      return 'Não consegui identificar nenhuma ação no que você disse.'
    }

    const parts: string[] = []

    for (const action of nlu.actions) {
      // Se o comando está incompleto, mostrar ajuda
      if (action.incomplete && action.helpText) {
        parts.push(`⚠️ Comando incompleto: ${action.helpText}`)
        continue
      }

      switch (action.intent) {
        case 'create_order': {
          const items =
            action.items
              ?.map((i) => `${i.quantity}x ${i.matchedProductName || i.name}`)
              .join(', ') || '(itens não identificados)'
          const location = action.comanda
            ? `comanda "${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          parts.push(`🆕 Criar pedido: ${items}${location ? ` para ${location}` : ''}`)
          break
        }
        case 'add_items': {
          const items =
            action.items
              ?.map((i) => `${i.quantity}x ${i.matchedProductName || i.name}`)
              .join(', ') || ''
          const addLoc = action.comanda
            ? `comanda "${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          parts.push(`➕ Adicionar${addLoc ? ` na ${addLoc}` : ''}: ${items}`)
          break
        }
        case 'remove_item':
          parts.push(
            `🗑️ Remover: ${action.items?.[0]?.matchedProductName || action.items?.[0]?.name || '?'}`
          )
          break
        case 'update_quantity':
          parts.push(
            `🔢 Alterar quantidade: ${action.items?.[0]?.matchedProductName || '?'} → ${action.items?.[0]?.quantity || '?'}`
          )
          break
        case 'open_comanda': {
          const location = action.comanda
            ? `"${action.comanda}"`
            : action.mesa
              ? `na mesa ${action.mesa}`
              : ''
          parts.push(`📋 Abrir comanda${location ? ` ${location}` : ''}`)
          break
        }
        case 'close_comanda':
          parts.push(
            `🔒 Fechar comanda${action.comanda ? ` "${action.comanda}"` : ''}${action.mesa ? ` da mesa ${action.mesa}` : ''}`
          )
          break
        case 'close_and_pay': {
          const payMap1: Record<string, string> = { cash: 'Dinheiro', card: 'Cartão', pix: 'PIX' }
          const payLabel = payMap1[action.paymentMethod || ''] || '?'
          const loc = action.comanda
            ? `"${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          const disc = action.discountPercentage
            ? ` com ${action.discountPercentage}% de desconto`
            : ''
          parts.push(`💳 Fechar e pagar${loc ? ` ${loc}` : ''} via ${payLabel}${disc}`)
          break
        }
        case 'confirm_order': {
          const loc = action.comanda
            ? `"${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          parts.push(`✅ Confirmar pedido${loc ? ` ${loc}` : ''}`)
          break
        }
        case 'update_order_status': {
          const statusLabels: Record<string, string> = {
            preparing: 'em preparo',
            ready: 'pronto',
            served: 'servido',
            paid: 'pago',
          }
          const loc = action.comanda
            ? `"${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          parts.push(
            `🔄 Marcar pedido${loc ? ` ${loc}` : ''} como ${statusLabels[action.status || ''] || action.status || '?'}`
          )
          break
        }
        case 'update_item_status': {
          const statusLabels: Record<string, string> = {
            preparing: 'em preparo',
            ready: 'pronto',
            served: 'servido',
            cancelled: 'cancelado',
          }
          const itemName = action.items?.[0]?.matchedProductName || action.items?.[0]?.name || '?'
          parts.push(
            `🔄 Marcar "${itemName}" como ${statusLabels[action.itemStatus || ''] || action.itemStatus || '?'}`
          )
          break
        }
        case 'cancel_order':
          parts.push('❌ Cancelar último pedido')
          break
        case 'query_status':
          parts.push(`🔍 Consultar status${action.mesa ? ` da mesa ${action.mesa}` : ''}`)
          break
        case 'special_instruction':
          parts.push(
            `📝 Instrução especial: "${action.items?.[0]?.specialInstructions || '?'}" para ${action.items?.[0]?.matchedProductName || '?'}`
          )
          break
        case 'print_kitchen': {
          const loc = action.comanda
            ? `"${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          parts.push(`🖨️ Imprimir cozinha${loc ? ` ${loc}` : ''}`)
          break
        }
        case 'print_comanda': {
          const loc = action.comanda
            ? `"${action.comanda}"`
            : action.mesa
              ? `mesa ${action.mesa}`
              : ''
          parts.push(`🖨️ Imprimir comanda${loc ? ` ${loc}` : ''}`)
          break
        }
        case 'create_sale': {
          const items =
            action.items
              ?.map((i) => `${i.quantity}x ${i.matchedProductName || i.name}`)
              .join(', ') || '?'
          const payMap2: Record<string, string> = { cash: 'Dinheiro', card: 'Cartão', pix: 'PIX' }
          const payLabel = payMap2[action.paymentMethod || ''] || '?'
          parts.push(`💰 Venda avulsa: ${items} via ${payLabel}`)
          break
        }
        case 'open_cash':
          parts.push(
            `🏦 Abrir caixa${action.amount ? ` com R$ ${action.amount.toFixed(2).replace('.', ',')}` : ''}`
          )
          break
        case 'close_cash':
          parts.push(
            `🏦 Fechar caixa${action.amount ? ` com saldo R$ ${action.amount.toFixed(2).replace('.', ',')}` : ''}`
          )
          break
        case 'help':
          parts.push('📖 Exibir ajuda com todos os comandos de voz disponíveis')
          break
      }
    }

    return parts.join('; ')
  }
}
