/**
 * VoiceActionExecutor — Mapeia intents interpretados pelo NLU em chamadas reais ao PedidoService/Comanda.
 */
import PedidoService from './pedido_service.js'
import ComandaCloseService from '#services/comanda_close_service'
import Comanda from '#models/comanda'
import Mesa from '#models/mesa'
import Pedido from '#models/pedido'
import PedidoItem from '#models/pedido_item'
import CardapioProduto from '#models/cardapio_produto'
import Venda from '#models/venda'
import VendaItem from '#models/venda_item'
import CaixaRegistro from '#models/caixa_registro'
import logger from '@adonisjs/core/services/logger'
import type { ParsedVoiceAction } from './voice_intent_parser.js'

export interface ActionResult {
  actionIndex: number
  success: boolean
  pedidoId?: number
  orderNumber?: string
  error?: string
  feedback: string
}

export default class VoiceActionExecutor {
  private empresaId: number
  private user: any
  private timezone?: string

  constructor(empresaId: number, user: any, timezone?: string) {
    this.empresaId = empresaId
    this.user = user
    this.timezone = timezone
  }

  /**
   * Executa uma ação de voz individual.
   */
  async execute(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    try {
      switch (action.intent) {
        case 'create_order':
          return await this.createOrder(action, actionIndex)
        case 'add_items':
          return await this.addItems(action, actionIndex)
        case 'remove_item':
          return await this.removeItem(action, actionIndex)
        case 'update_quantity':
          return await this.updateQuantity(action, actionIndex)
        case 'open_comanda':
          return await this.openComanda(action, actionIndex)
        case 'close_comanda':
          return await this.closeComanda(action, actionIndex)
        case 'close_and_pay':
          return await this.closeAndPay(action, actionIndex)
        case 'cancel_order':
          return await this.cancelOrder(action, actionIndex)
        case 'confirm_order':
          return await this.confirmOrder(action, actionIndex)
        case 'update_order_status':
          return await this.updateOrderStatus(action, actionIndex)
        case 'update_item_status':
          return await this.updateItemStatus(action, actionIndex)
        case 'query_status':
          return await this.queryStatus(action, actionIndex)
        case 'special_instruction':
          return await this.specialInstruction(action, actionIndex)
        case 'print_kitchen':
          return await this.printKitchen(action, actionIndex)
        case 'print_comanda':
          return await this.printComanda(action, actionIndex)
        case 'create_sale':
          return await this.createSale(action, actionIndex)
        case 'open_cash':
          return await this.openCash(action, actionIndex)
        case 'close_cash':
          return await this.closeCash(action, actionIndex)
        case 'help':
          return this.showHelp(actionIndex)
        default:
          return {
            actionIndex,
            success: false,
            error: `Intent desconhecido: ${action.intent}`,
            feedback: 'Não entendi o que você quer fazer. Tente novamente.',
          }
      }
    } catch (error: any) {
      logger.error({ error: error.message, intent: action.intent }, 'VOICE_ACTION_ERROR')
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback: this.friendlyError(error.message),
      }
    }
  }

  /**
   * Cria um novo pedido.
   */
  private async createOrder(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    if (!action.items || action.items.length === 0) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum item identificado',
        feedback: 'Não consegui identificar nenhum item no pedido. Pode repetir?',
      }
    }

    // Resolver comanda
    let comandaId: number | undefined
    const comanda = await this.resolveComanda(action)
    if (comanda) {
      comandaId = comanda.id
    }

    // Validar produtos
    const items = []
    const unavailable: string[] = []

    for (const item of action.items) {
      if (!item.matchedProductId) {
        unavailable.push(item.name)
        continue
      }

      const product = await CardapioProduto.query()
        .where('id', item.matchedProductId)
        .where('empresa_id', this.empresaId)
        .where('available', true)
        .where('active', true)
        .first()

      if (!product) {
        unavailable.push(item.matchedProductName || item.name)
        continue
      }

      items.push({
        cardapioProductId: product.id,
        quantity: item.quantity || 1,
        specialInstructions: item.specialInstructions,
      })
    }

    if (items.length === 0) {
      const names = unavailable.join(', ')
      return {
        actionIndex,
        success: false,
        error: `Produtos não encontrados ou indisponíveis: ${names}`,
        feedback: `Não encontrei os seguintes itens no cardápio: ${names}. Verifique a disponibilidade.`,
      }
    }

    const pedido = await PedidoService.createPedido(
      {
        comandaId,
        type: action.orderType || 'dine_in',
        items,
      },
      this.user,
      logger,
      this.timezone
    )

    // Carregar itens para feedback
    await pedido.load('items', (q) => q.preload('cardapioProduto'))
    const itemsList = pedido.items
      .map((i: PedidoItem) => `${i.quantity}x ${i.cardapioProduto?.name || i.itemName}`)
      .join(', ')

    let location = ''
    if (comanda) {
      location = comanda.name ? ` (${comanda.name})` : ` (mesa ${action.mesa || comanda.mesaId})`
    }

    const warningPart =
      unavailable.length > 0 ? ` ⚠️ Não encontrado: ${unavailable.join(', ')}.` : ''

    logger.info(
      { pedidoId: pedido.id, orderNumber: pedido.orderNumber, intent: 'create_order' },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      orderNumber: pedido.orderNumber,
      feedback: `Pedido #${pedido.orderNumber} criado: ${itemsList}${location}.${warningPart}`,
    }
  }

  /**
   * Adiciona itens a um pedido existente.
   * Se não houver pedido ativo na comanda, cria um novo automaticamente.
   */
  private async addItems(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback:
          'Não consegui identificar a comanda. Diga o nome da comanda ou o número da mesa. Ex: "incluir água na comanda Bernardo".',
      }
    }

    if (!action.items || action.items.length === 0) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum item identificado',
        feedback: 'Não identifiquei nenhum item para adicionar. Pode repetir?',
      }
    }

    // Encontrar último pedido ativo da comanda
    let pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', ['pending', 'confirmed', 'preparing'])
      .orderBy('created_at', 'desc')
      .first()

    // Se não há pedido ativo, cria um novo automaticamente
    if (!pedido) {
      // Validar produtos antes de criar pedido
      const itemsForCreate = []
      for (const item of action.items) {
        if (!item.matchedProductId) continue
        const product = await CardapioProduto.query()
          .where('id', item.matchedProductId)
          .where('empresa_id', this.empresaId)
          .where('available', true)
          .where('active', true)
          .first()
        if (product) {
          itemsForCreate.push({
            cardapioProductId: product.id,
            quantity: item.quantity || 1,
            specialInstructions: item.specialInstructions,
          })
        }
      }

      if (itemsForCreate.length === 0) {
        return {
          actionIndex,
          success: false,
          error: 'Nenhum item válido encontrado',
          feedback: 'Nenhum dos itens mencionados foi encontrado no cardápio.',
        }
      }

      pedido = await PedidoService.createPedido(
        {
          comandaId: comanda.id,
          type: action.orderType || 'dine_in',
          items: itemsForCreate,
        },
        this.user,
        logger,
        this.timezone
      )

      await pedido.load('items', (q) => q.preload('cardapioProduto'))
      const itemsList = pedido.items
        .map((i: PedidoItem) => `${i.quantity}x ${i.cardapioProduto?.name || i.itemName}`)
        .join(', ')

      const comandaLabel = comanda.name || `Comanda ${comanda.number}`

      logger.info(
        {
          pedidoId: pedido.id,
          orderNumber: pedido.orderNumber,
          comandaId: comanda.id,
          intent: 'add_items_new_order',
        },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        pedidoId: pedido.id,
        orderNumber: pedido.orderNumber,
        feedback: `Novo pedido #${pedido.orderNumber} criado na comanda ${comandaLabel}: ${itemsList}.`,
      }
    }

    const added: string[] = []
    for (const item of action.items) {
      if (!item.matchedProductId) continue

      const product = await CardapioProduto.query()
        .where('id', item.matchedProductId)
        .where('empresa_id', this.empresaId)
        .where('available', true)
        .where('active', true)
        .first()

      if (!product) continue

      const quantity = item.quantity || 1
      const unitPrice = Number(product.salePrice) || 0

      await PedidoItem.create({
        pedidoId: pedido.id,
        cardapioProdutoId: product.id,
        itemName: product.name,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        specialInstructions: item.specialInstructions || null,
      })

      added.push(`${quantity}x ${product.name}`)
    }

    // Recalcular totais do pedido
    await pedido.load('items')
    await pedido.calculateTotals()

    if (added.length === 0) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum item válido encontrado',
        feedback: 'Nenhum dos itens mencionados foi encontrado no cardápio.',
      }
    }

    const comandaLabel = comanda.name || `Comanda ${comanda.number}`

    logger.info(
      { pedidoId: pedido.id, addedCount: added.length, comandaId: comanda.id, intent: 'add_items' },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      orderNumber: pedido.orderNumber,
      feedback: `Adicionado ao pedido #${pedido.orderNumber} (${comandaLabel}): ${added.join(', ')}.`,
    }
  }

  /**
   * Remove item de pedido.
   */
  private async removeItem(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda.',
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', ['pending', 'confirmed'])
      .orderBy('created_at', 'desc')
      .preload('items')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido editável encontrado',
        feedback: 'Não encontrei nenhum pedido que possa ser editado nessa comanda.',
      }
    }

    const itemToRemove = action.items?.[0]
    if (!itemToRemove?.matchedProductId) {
      return {
        actionIndex,
        success: false,
        error: 'Item não identificado',
        feedback: 'Não identifiquei qual item remover.',
      }
    }

    const pedidoItem = pedido.items.find(
      (i: PedidoItem) => i.cardapioProdutoId === itemToRemove.matchedProductId
    )

    if (!pedidoItem) {
      return {
        actionIndex,
        success: false,
        error: 'Item não encontrado no pedido',
        feedback: `O item "${itemToRemove.matchedProductName || itemToRemove.name}" não está neste pedido.`,
      }
    }

    await pedidoItem.delete()
    await pedido.refresh()

    logger.info(
      {
        pedidoId: pedido.id,
        removedProduct: itemToRemove.matchedProductName,
        intent: 'remove_item',
      },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      feedback: `"${itemToRemove.matchedProductName || itemToRemove.name}" removido do pedido #${pedido.orderNumber}.`,
    }
  }

  /**
   * Altera quantidade de item.
   */
  private async updateQuantity(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda.',
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', ['pending', 'confirmed'])
      .orderBy('created_at', 'desc')
      .preload('items')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido editável encontrado',
        feedback: 'Não encontrei nenhum pedido que possa ser editado.',
      }
    }

    const item = action.items?.[0]
    if (!item?.matchedProductId) {
      return {
        actionIndex,
        success: false,
        error: 'Item não identificado',
        feedback: 'Não identifiquei qual item alterar.',
      }
    }

    const pedidoItem = pedido.items.find(
      (i: PedidoItem) => i.cardapioProdutoId === item.matchedProductId
    )

    if (!pedidoItem) {
      return {
        actionIndex,
        success: false,
        error: 'Item não encontrado no pedido',
        feedback: `"${item.matchedProductName || item.name}" não está neste pedido.`,
      }
    }

    pedidoItem.quantity = item.quantity || 1
    await pedidoItem.save()
    await pedido.refresh()

    logger.info(
      {
        pedidoId: pedido.id,
        product: item.matchedProductName,
        newQty: item.quantity,
        intent: 'update_quantity',
      },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      feedback: `Quantidade de "${item.matchedProductName || item.name}" alterada para ${item.quantity} no pedido #${pedido.orderNumber}.`,
    }
  }

  /**
   * Abre/cria uma nova comanda.
   */
  private async openComanda(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    // Verificar se já existe comanda ativa para esta mesa
    if (action.mesa) {
      const mesa = await Mesa.query()
        .where('empresa_id', this.empresaId)
        .where('number', String(action.mesa))
        .first()

      if (!mesa) {
        return {
          actionIndex,
          success: false,
          error: 'Mesa não encontrada',
          feedback: `Mesa ${action.mesa} não encontrada. Verifique o número.`,
        }
      }

      const existing = await Comanda.query()
        .where('empresa_id', this.empresaId)
        .where('mesa_id', mesa.id)
        .where('active', true)
        .first()

      if (existing) {
        return {
          actionIndex,
          success: true,
          feedback: `Já existe uma comanda ativa na mesa ${action.mesa}: ${existing.name || `Comanda ${existing.number}`}.`,
        }
      }

      const nextNumber = await this.nextComandaNumber()
      const comanda = await Comanda.create({
        empresaId: this.empresaId,
        mesaId: mesa.id,
        number: nextNumber,
        name: action.comanda || `Mesa ${mesa.number}`,
        active: true,
      })

      logger.info(
        {
          comandaId: comanda.id,
          comandaNumber: comanda.number,
          mesa: action.mesa,
          intent: 'open_comanda',
        },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        feedback: `Comanda ${comanda.number} aberta para mesa ${action.mesa}.`,
      }
    }

    // Comanda sem mesa (por nome ou avulsa)
    const nextNumber = await this.nextComandaNumber()
    const comanda = await Comanda.create({
      empresaId: this.empresaId,
      mesaId: null,
      number: nextNumber,
      name: action.comanda || `Comanda ${nextNumber}`,
      active: true,
    })

    logger.info(
      {
        comandaId: comanda.id,
        comandaNumber: comanda.number,
        name: comanda.name,
        intent: 'open_comanda',
      },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      feedback: `Comanda ${comanda.number} (${comanda.name}) aberta com sucesso.`,
    }
  }

  /**
   * Fecha comanda.
   */
  private async closeComanda(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback:
          'Não consegui identificar qual comanda fechar. Diga: "fechar comanda da mesa [número]" ou "fechar comanda [nome]".',
      }
    }

    if (!comanda.active) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda já está fechada',
        feedback: `A comanda ${comanda.displayName} já está fechada.`,
      }
    }

    // Verificar se há pedidos não finalizados
    const pendingOrders = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .count('* as total')

    const pendingCount = Number(pendingOrders[0].$extras.total)
    if (pendingCount > 0) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda tem pedidos pendentes',
        feedback: `A comanda ${comanda.displayName} ainda tem ${pendingCount} pedido(s) não finalizado(s). Finalize-os antes de fechar.`,
      }
    }

    comanda.active = false
    await comanda.save()

    logger.info({ comandaId: comanda.id, intent: 'close_comanda' }, 'VOICE_ACTION_EXECUTED')

    return {
      actionIndex,
      success: true,
      feedback: `Comanda ${comanda.displayName} fechada com sucesso.`,
    }
  }

  /**
   * Fecha comanda E gera venda com pagamento via ComandaCloseService.
   */
  private async closeAndPay(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText || 'Diga: "fechar e pagar mesa [número] no [pix/cartão/dinheiro]".',
      }
    }

    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback:
          'Não consegui identificar qual comanda fechar. Diga: "fechar e pagar mesa [número] no [pix/cartão/dinheiro]".',
      }
    }

    if (!comanda.active) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda já está fechada',
        feedback: `A comanda ${comanda.displayName} já está fechada.`,
      }
    }

    const paymentMethodMap: Record<string, string> = {
      cash: 'cash',
      card: 'card',
      pix: 'pix',
    }

    const paymentMethod = paymentMethodMap[action.paymentMethod || ''] || 'cash'
    const discountPercentage = action.discountPercentage || 0

    try {
      const result = await ComandaCloseService.closeAndPay({
        comanda,
        user: this.user,
        paymentMethod,
        discountPercentage,
        emitNfce: false,
        timezone: this.timezone || 'America/Sao_Paulo',
        logger,
      })

      const paymentLabel =
        { cash: 'Dinheiro', card: 'Cartão', pix: 'PIX' }[paymentMethod] || paymentMethod
      const totalStr = `R$ ${Number(result.venda.total || 0)
        .toFixed(2)
        .replace('.', ',')}`

      logger.info(
        { comandaId: comanda.id, vendaId: result.venda.id, paymentMethod, intent: 'close_and_pay' },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        feedback: `Comanda ${comanda.displayName} fechada. Venda ${totalStr} gerada via ${paymentLabel}${discountPercentage > 0 ? ` com ${discountPercentage}% de desconto` : ''}.`,
      }
    } catch (error: any) {
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback: `Erro ao fechar comanda: ${error.message}`,
      }
    }
  }

  /**
   * Confirma um pedido pendente.
   */
  private async confirmOrder(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText ||
          'Diga: "confirmar pedido da mesa [número]" ou "confirmar pedido da comanda [nome]".',
      }
    }

    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda. Diga: "confirmar pedido da mesa [número]".',
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .where('status', 'pending')
      .orderBy('created_at', 'desc')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido pendente encontrado',
        feedback: `Não encontrei nenhum pedido pendente na comanda ${comanda.displayName}.`,
      }
    }

    await pedido.confirm(this.timezone)

    logger.info(
      { pedidoId: pedido.id, orderNumber: pedido.orderNumber, intent: 'confirm_order' },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      orderNumber: pedido.orderNumber,
      feedback: `Pedido #${pedido.orderNumber} confirmado.`,
    }
  }

  /**
   * Atualiza status do pedido (preparing, ready, served, paid).
   */
  private async updateOrderStatus(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText ||
          'Diga: "preparar pedido mesa [número]", "pedido pronto mesa [número]", "servir mesa [número]" ou "pagar mesa [número]".',
      }
    }

    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda. Diga: "preparar pedido mesa [número]".',
      }
    }

    const targetStatus = action.status
    if (!targetStatus) {
      return {
        actionIndex,
        success: false,
        error: 'Status não informado',
        feedback: 'Qual status? Diga: "preparar", "pronto", "servir" ou "pagar".',
      }
    }

    // Mapear quais status podem transicionar para o alvo
    const validPreviousMap: Record<string, string[]> = {
      preparing: ['pending', 'confirmed'],
      ready: ['preparing'],
      served: ['ready'],
      paid: ['served'],
    }

    const previous = validPreviousMap[targetStatus]
    if (!previous) {
      return {
        actionIndex,
        success: false,
        error: `Status inválido: ${targetStatus}`,
        feedback: `Status "${targetStatus}" não é válido. Use: preparar, pronto, servir ou pagar.`,
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', previous)
      .orderBy('created_at', 'desc')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: `Nenhum pedido no status adequado para transição para ${targetStatus}`,
        feedback: `Não encontrei nenhum pedido que possa ser alterado para "${targetStatus}" na comanda ${comanda.displayName}.`,
      }
    }

    try {
      switch (targetStatus) {
        case 'preparing':
          await pedido.startPreparing()
          await pedido.deductInsumoStock()
          break
        case 'ready':
          await pedido.markReady(this.timezone)
          break
        case 'served':
          await pedido.serve(this.timezone)
          break
        case 'paid':
          await pedido.pay(this.timezone)
          break
      }

      const statusLabels: Record<string, string> = {
        preparing: 'em preparo',
        ready: 'pronto',
        served: 'servido',
        paid: 'pago',
      }

      logger.info(
        {
          pedidoId: pedido.id,
          orderNumber: pedido.orderNumber,
          newStatus: targetStatus,
          intent: 'update_order_status',
        },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        pedidoId: pedido.id,
        orderNumber: pedido.orderNumber,
        feedback: `Pedido #${pedido.orderNumber} marcado como ${statusLabels[targetStatus] || targetStatus}.`,
      }
    } catch (error: any) {
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback: this.friendlyError(error.message),
      }
    }
  }

  /**
   * Atualiza status de um item individual.
   */
  private async updateItemStatus(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText ||
          'Diga: "[produto] da mesa [número] está pronto/servido" ou "cancelar [produto] da mesa [número]".',
      }
    }

    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda.',
      }
    }

    const itemRef = action.items?.[0]
    if (!itemRef?.matchedProductId) {
      return {
        actionIndex,
        success: false,
        error: 'Item não identificado',
        feedback: 'Não identifiquei qual item alterar. Diga o nome do produto e a mesa.',
      }
    }

    const itemStatus = action.itemStatus
    if (!itemStatus) {
      return {
        actionIndex,
        success: false,
        error: 'Status não informado',
        feedback: 'Qual status? Diga: "preparando", "pronto", "servido" ou "cancelar".',
      }
    }

    // Buscar pedido ativo da comanda
    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereNotIn('status', ['cancelled', 'paid'])
      .orderBy('created_at', 'desc')
      .preload('items')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido ativo',
        feedback: `Não encontrei pedido ativo na comanda ${comanda.displayName}.`,
      }
    }

    const pedidoItem = pedido.items.find(
      (i: PedidoItem) => i.cardapioProdutoId === itemRef.matchedProductId
    )

    if (!pedidoItem) {
      return {
        actionIndex,
        success: false,
        error: 'Item não encontrado no pedido',
        feedback: `"${itemRef.matchedProductName || itemRef.name}" não está no pedido.`,
      }
    }

    try {
      switch (itemStatus) {
        case 'preparing':
          await pedidoItem.merge({ status: 'preparing' }).save()
          break
        case 'ready':
          await pedidoItem.merge({ status: 'ready' }).save()
          break
        case 'served':
          await pedidoItem.merge({ status: 'served' }).save()
          break
        case 'cancelled':
          await pedidoItem.merge({ status: 'cancelled' }).save()
          break
        default:
          return {
            actionIndex,
            success: false,
            error: `Status inválido: ${itemStatus}`,
            feedback: `Status "${itemStatus}" não reconhecido para item.`,
          }
      }

      const statusLabels: Record<string, string> = {
        preparing: 'em preparo',
        ready: 'pronto',
        served: 'servido',
        cancelled: 'cancelado',
      }

      logger.info(
        { pedidoId: pedido.id, itemId: pedidoItem.id, itemStatus, intent: 'update_item_status' },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        pedidoId: pedido.id,
        feedback: `"${itemRef.matchedProductName || itemRef.name}" marcado como ${statusLabels[itemStatus] || itemStatus} no pedido #${pedido.orderNumber}.`,
      }
    } catch (error: any) {
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback: this.friendlyError(error.message),
      }
    }
  }

  /**
   * Imprime pedido para cozinha.
   */
  private async printKitchen(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText ||
          'Diga: "imprimir cozinha mesa [número]" ou "imprimir pedido da comanda [nome]".',
      }
    }

    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda. Diga: "imprimir cozinha mesa [número]".',
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereNotIn('status', ['cancelled', 'paid'])
      .orderBy('created_at', 'desc')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido ativo',
        feedback: `Não encontrei pedido ativo na comanda ${comanda.displayName}.`,
      }
    }

    logger.info({ pedidoId: pedido.id, intent: 'print_kitchen' }, 'VOICE_ACTION_EXECUTED')

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      orderNumber: pedido.orderNumber,
      feedback: `Impressão de cozinha gerada para pedido #${pedido.orderNumber}. Acesse a tela do pedido para imprimir.`,
    }
  }

  /**
   * Imprime comanda.
   */
  private async printComanda(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText ||
          'Diga: "imprimir comanda da mesa [número]" ou "imprimir comanda [nome]".',
      }
    }

    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda.',
      }
    }

    logger.info({ comandaId: comanda.id, intent: 'print_comanda' }, 'VOICE_ACTION_EXECUTED')

    return {
      actionIndex,
      success: true,
      feedback: `Impressão da comanda ${comanda.displayName} gerada. Acesse a tela de comandas para imprimir.`,
    }
  }

  /**
   * Venda avulsa (sem comanda/pedido).
   */
  private async createSale(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    if (action.incomplete) {
      return {
        actionIndex,
        success: false,
        error: 'Comando incompleto',
        feedback:
          action.helpText ||
          'Diga: "vender [quantidade] [produto] no [pix/cartão/dinheiro]". Ex: "vender 2 coca-cola no pix".',
      }
    }

    if (!action.items || action.items.length === 0) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum item identificado',
        feedback:
          'Não identifiquei os itens da venda. Diga: "vender [quantidade] [produto] no [pix/cartão/dinheiro]".',
      }
    }

    if (!action.paymentMethod) {
      return {
        actionIndex,
        success: false,
        error: 'Método de pagamento não informado',
        feedback: 'Qual a forma de pagamento? Diga: "no pix", "no cartão" ou "em dinheiro".',
      }
    }

    const paymentMethodMap: Record<string, string> = { cash: 'cash', card: 'card', pix: 'pix' }
    const paymentMethod = paymentMethodMap[action.paymentMethod] || 'cash'

    try {
      const { DateTime } = await import('luxon')
      const tz = this.timezone || 'America/Sao_Paulo'
      const now = DateTime.now().setZone(tz)

      const venda = await Venda.create({
        empresaId: this.empresaId,
        userId: this.user.id,
        paymentMethod: paymentMethod as 'cash' | 'card' | 'pix',
        subtotal: 0,
        discount: 0,
        total: 0,
        saleDate: now,
      })

      let totalValue = 0
      const addedItems: string[] = []

      for (const item of action.items) {
        if (!item.matchedProductId) continue

        const product = await CardapioProduto.query()
          .where('id', item.matchedProductId)
          .where('empresa_id', this.empresaId)
          .where('available', true)
          .where('active', true)
          .first()

        if (!product) continue

        const qty = item.quantity || 1
        const unitPrice = Number(product.salePrice) || 0
        const itemTotal = qty * unitPrice

        await VendaItem.create({
          vendaId: venda.id,
          cardapioProdutoId: product.id,
          itemName: product.name,
          quantity: qty,
          unitPrice,
          subtotal: itemTotal,
        })

        totalValue += itemTotal
        addedItems.push(`${qty}x ${product.name}`)
      }

      if (addedItems.length === 0) {
        await venda.delete()
        return {
          actionIndex,
          success: false,
          error: 'Nenhum produto válido encontrado',
          feedback: 'Nenhum dos produtos mencionados foi encontrado no cardápio.',
        }
      }

      venda.subtotal = totalValue
      venda.total = totalValue
      await venda.save()

      const paymentLabel =
        { cash: 'Dinheiro', card: 'Cartão', pix: 'PIX' }[paymentMethod] || paymentMethod

      logger.info(
        { vendaId: venda.id, total: totalValue, paymentMethod, intent: 'create_sale' },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        feedback: `Venda registrada: ${addedItems.join(', ')} — Total R$ ${totalValue.toFixed(2).replace('.', ',')} via ${paymentLabel}.`,
      }
    } catch (error: any) {
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback: `Erro ao registrar venda: ${error.message}`,
      }
    }
  }

  /**
   * Abre caixa.
   */
  private async openCash(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    try {
      const openingBalance = action.amount || 0
      const registro = await CaixaRegistro.openRegister(
        this.empresaId,
        this.user.id,
        openingBalance,
        this.timezone
      )

      logger.info(
        { registroId: registro.id, openingBalance, intent: 'open_cash' },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        feedback: `Caixa aberto com sucesso${openingBalance > 0 ? ` com saldo inicial de R$ ${openingBalance.toFixed(2).replace('.', ',')}` : ''}.`,
      }
    } catch (error: any) {
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback:
          error.message === 'Já existe um caixa aberto'
            ? 'Já existe um caixa aberto. Feche-o antes de abrir outro.'
            : `Erro ao abrir caixa: ${error.message}`,
      }
    }
  }

  /**
   * Fecha caixa.
   */
  private async closeCash(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    const openRegister = await CaixaRegistro.query()
      .where('empresa_id', this.empresaId)
      .where('status', 'open')
      .first()

    if (!openRegister) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum caixa aberto',
        feedback: 'Não há caixa aberto para fechar.',
      }
    }

    try {
      const closingBalance = action.amount || 0
      await openRegister.closeRegister(closingBalance, 'Fechado por comando de voz', this.timezone)

      logger.info(
        { registroId: openRegister.id, closingBalance, intent: 'close_cash' },
        'VOICE_ACTION_EXECUTED'
      )

      return {
        actionIndex,
        success: true,
        feedback: `Caixa fechado com sucesso${closingBalance > 0 ? ` com saldo final de R$ ${closingBalance.toFixed(2).replace('.', ',')}` : ''}.`,
      }
    } catch (error: any) {
      return {
        actionIndex,
        success: false,
        error: error.message,
        feedback: `Erro ao fechar caixa: ${error.message}`,
      }
    }
  }

  /**
   * Mostra ajuda com todos os comandos disponíveis.
   */
  private showHelp(actionIndex: number): ActionResult {
    const helpText = [
      '🎤 COMANDOS DE VOZ DISPONÍVEIS:',
      '',
      '📋 PEDIDOS (por comanda ou mesa):',
      '• "Incluir [itens] na comanda [Nome]" — Adicionar itens (cria pedido se necessário)',
      '• "Mais uma [produto] pro [Nome]" — Adicionar ao pedido existente',
      '• "Criar pedido comanda [Nome] com [itens]" — Novo pedido',
      '• "Remover [produto] da comanda [Nome]" — Remover item',
      '• "Alterar quantidade [produto] para [N] na comanda [Nome]" — Mudar quantidade',
      '• "Confirmar comanda [Nome]" — Confirmar pedido pendente',
      '• "Preparar comanda [Nome]" — Mandar para cozinha',
      '• "Pedido pronto comanda [Nome]" — Marcar como pronto',
      '• "Servir comanda [Nome]" — Marcar como servido',
      '• "Cancelar pedido comanda [Nome]" — Cancelar pedido',
      '',
      '🪧 COMANDAS:',
      '• "Abrir comanda do [Nome]" — Abrir comanda nomeada',
      '• "Abrir comanda mesa [N]" — Abrir comanda na mesa',
      '• "Fechar comanda [Nome]" — Fechar sem pagamento',
      '• "Fechar e pagar comanda [Nome] no [pix/cartão/dinheiro]" — Fechar + venda',
      '',
      '🔍 CONSULTAS:',
      '• "Status comanda [Nome]" — Ver status e total',
      '• "[Produto] da comanda [Nome] observação [texto]" — Obs. no item',
      '',
      '🖨️ IMPRESSÃO:',
      '• "Imprimir cozinha comanda [Nome]" — Impressão para cozinha',
      '• "Imprimir comanda [Nome]" — Impressão da comanda',
      '',
      '💰 VENDAS E CAIXA:',
      '• "Vender [qtd] [produto] no [pix/cartão/dinheiro]" — Venda avulsa',
      '• "Abrir caixa" — Abrir caixa registradora',
      '• "Fechar caixa" — Fechar caixa registradora',
      '',
      '💡 Dica: Pode usar "mesa [N]" no lugar de "comanda [Nome]" em qualquer comando.',
    ].join('\n')

    return {
      actionIndex,
      success: true,
      feedback: helpText,
    }
  }

  /**
   * Cancela pedido.
   */
  private async cancelOrder(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda do pedido.',
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', ['pending', 'confirmed'])
      .orderBy('created_at', 'desc')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido cancelável encontrado',
        feedback: 'Não encontrei nenhum pedido que possa ser cancelado nessa comanda.',
      }
    }

    pedido.status = 'cancelled'
    const { DateTime } = await import('luxon')
    pedido.cancelledAt = DateTime.now()
    await pedido.save()

    logger.info(
      { pedidoId: pedido.id, orderNumber: pedido.orderNumber, intent: 'cancel_order' },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      feedback: `Pedido #${pedido.orderNumber} cancelado.`,
    }
  }

  /**
   * Consulta status / total.
   */
  private async queryStatus(action: ParsedVoiceAction, actionIndex: number): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar qual comanda consultar.',
      }
    }

    const pedidos = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereNot('status', 'cancelled')
      .preload('items')

    const totalItems = pedidos.reduce((sum, p) => sum + p.items.length, 0)
    const totalValue = pedidos.reduce((sum, p) => sum + Number(p.total || 0), 0)

    return {
      actionIndex,
      success: true,
      feedback: `${comanda.displayName}: ${pedidos.length} pedido(s), ${totalItems} item(ns), total R$ ${totalValue.toFixed(2).replace('.', ',')}.`,
    }
  }

  /**
   * Adiciona instrução especial a item.
   */
  private async specialInstruction(
    action: ParsedVoiceAction,
    actionIndex: number
  ): Promise<ActionResult> {
    const comanda = await this.resolveComanda(action)
    if (!comanda) {
      return {
        actionIndex,
        success: false,
        error: 'Comanda não identificada',
        feedback: 'Não consegui identificar a comanda.',
      }
    }

    const pedido = await Pedido.query()
      .where('comanda_id', comanda.id)
      .whereIn('status', ['pending', 'confirmed'])
      .orderBy('created_at', 'desc')
      .preload('items')
      .first()

    if (!pedido) {
      return {
        actionIndex,
        success: false,
        error: 'Nenhum pedido editável encontrado',
        feedback: 'Não encontrei nenhum pedido editável.',
      }
    }

    const item = action.items?.[0]
    if (!item?.matchedProductId || !item.specialInstructions) {
      return {
        actionIndex,
        success: false,
        error: 'Item ou instrução não identificados',
        feedback: 'Não identifiquei o item ou a instrução especial.',
      }
    }

    const pedidoItem = pedido.items.find(
      (i: PedidoItem) => i.cardapioProdutoId === item.matchedProductId
    )

    if (!pedidoItem) {
      return {
        actionIndex,
        success: false,
        error: 'Item não encontrado no pedido',
        feedback: `"${item.matchedProductName || item.name}" não está neste pedido.`,
      }
    }

    pedidoItem.specialInstructions = item.specialInstructions
    await pedidoItem.save()

    logger.info(
      {
        pedidoId: pedido.id,
        product: item.matchedProductName,
        instruction: item.specialInstructions,
        intent: 'special_instruction',
      },
      'VOICE_ACTION_EXECUTED'
    )

    return {
      actionIndex,
      success: true,
      pedidoId: pedido.id,
      feedback: `Observação "${item.specialInstructions}" adicionada ao ${item.matchedProductName || item.name}.`,
    }
  }

  /**
   * Resolve comanda a partir de mesa (número) ou nome da comanda.
   */
  private async resolveComanda(action: ParsedVoiceAction): Promise<Comanda | null> {
    // Tentar por nome da comanda
    if (action.comanda) {
      const comanda = await Comanda.query()
        .where('empresa_id', this.empresaId)
        .where('active', true)
        .whereRaw('LOWER(name) LIKE ?', [`%${action.comanda.toLowerCase()}%`])
        .first()

      if (comanda) return comanda
    }

    // Tentar por número de mesa
    if (action.mesa) {
      const mesa = await Mesa.query()
        .where('empresa_id', this.empresaId)
        .where('number', String(action.mesa))
        .first()

      if (mesa) {
        // Buscar comanda ativa da mesa
        let comanda = await Comanda.query()
          .where('empresa_id', this.empresaId)
          .where('mesa_id', mesa.id)
          .where('active', true)
          .first()

        // Se não tem comanda ativa, criar
        if (!comanda) {
          const nextNumber = await this.nextComandaNumber()
          comanda = await Comanda.create({
            empresaId: this.empresaId,
            mesaId: mesa.id,
            number: nextNumber,
            name: `Mesa ${mesa.number}`,
            active: true,
          })
        }

        return comanda
      }
    }

    return null
  }

  /**
   * Gera próximo número de comanda.
   */
  private async nextComandaNumber(): Promise<string> {
    const last = await Comanda.query()
      .where('empresa_id', this.empresaId)
      .orderBy('id', 'desc')
      .first()

    const lastNum = last ? Number.parseInt(last.number, 10) || 0 : 0
    return String(lastNum + 1).padStart(3, '0')
  }

  /**
   * Converte erros técnicos em mensagens amigáveis.
   */
  private friendlyError(message: string): string {
    if (message.includes('Insumos insuficientes')) {
      return 'Alguns itens estão indisponíveis por falta de insumos no estoque.'
    }
    if (message.includes('not found') || message.includes('não encontrad')) {
      return 'Não encontrei o que você mencionou. Pode tentar de novo?'
    }
    return 'Ocorreu um erro ao executar a ação. Tente novamente.'
  }
}
