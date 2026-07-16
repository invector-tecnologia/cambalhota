import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from '#models/empresa'
import User from '#models/user'
import Pedido from '#models/pedido'
import Comanda from '#models/comanda'
import VendaItem from '#models/venda_item'

const DEFAULT_TZ = 'America/Sao_Paulo'

export default class Venda extends BaseModel {
  static table = 'tavolo.vendas'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare pedidoId: number | null

  @column()
  declare comandaId: number | null

  @column()
  declare userId: number

  @column()
  declare saleNumber: string

  @column()
  declare paymentMethod: 'cash' | 'card' | 'pix' | 'split'

  @column({ consume: (value: string | number) => Number(value) })
  declare subtotal: number

  @column({ consume: (value: string | number) => Number(value) })
  declare discount: number

  @column({ consume: (value: string | number) => Number(value) })
  declare tax: number

  @column({ consume: (value: string | number) => Number(value) })
  declare total: number

  @column({ consume: (value: string | number) => Number(value) })
  declare costTotal: number

  @column({ consume: (value: string | number) => Number(value) })
  declare profit: number

  @column({ consume: (value: string | number) => Number(value) })
  declare profitMargin: number

  @column()
  declare notes: string | null

  @column.dateTime()
  declare saleDate: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static setDefaults(venda: Venda) {
    if (venda.tax === undefined) {
      venda.tax = 0
    }
    if (venda.discount === undefined) {
      venda.discount = 0
    }
  }

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Pedido, { foreignKey: 'pedidoId' })
  declare pedido: BelongsTo<typeof Pedido>

  @belongsTo(() => Comanda, { foreignKey: 'comandaId' })
  declare comanda: BelongsTo<typeof Comanda>

  @hasMany(() => VendaItem, { foreignKey: 'vendaId' })
  declare items: HasMany<typeof VendaItem>

  // Métodos de negócio
  static async generateSaleNumber(
    empresaId: number,
    timezone: string = DEFAULT_TZ
  ): Promise<string> {
    const today = DateTime.now().setZone(timezone)
    const year = today.toFormat('yy')
    const month = today.toFormat('MM')
    const day = today.toFormat('dd')
    const datePrefix = `${year}${month}${day}`

    const lastVenda = await Venda.query()
      .where('empresa_id', empresaId)
      .where('sale_number', 'like', `${datePrefix}%`)
      .orderBy('sale_number', 'desc')
      .first()

    let sequence = 1
    if (lastVenda) {
      const lastSequence = Number.parseInt(lastVenda.saleNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `${datePrefix}${sequence.toString().padStart(4, '0')}`
  }

  async calculateTotals(): Promise<void> {
    await this.load('items' as any)

    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0)
    this.costTotal = this.items.reduce((sum, item) => sum + item.costTotal, 0)
    this.total = this.subtotal - this.discount + this.tax
    // Lucro = receita (subtotal) - custo (antes de descontos/taxas)
    this.profit = this.subtotal - this.costTotal
    // Margem de lucro bruta = lucro / receita (sobre o subtotal, não o total)
    this.profitMargin = this.subtotal > 0 ? (this.profit / this.subtotal) * 100 : 0

    console.log('[VENDA CALCULATE_TOTALS] Cálculo de totais:')
    console.log(`  - Items loaded: ${this.items.length}`)
    console.log(`  - Subtotal: ${this.subtotal}`)
    console.log(`  - Discount: ${this.discount}`)
    console.log(`  - Tax: ${this.tax}`)
    console.log(`  - Formula: total = subtotal - discount + tax`)
    console.log(`  - Cálculo: ${this.subtotal} - ${this.discount} + ${this.tax} = ${this.total}`)
    console.log(`  - Cost Total: ${this.costTotal}`)
    console.log(`  - Profit: ${this.profit}`)
    console.log(`  - Profit Margin: ${this.profitMargin}%`)
  }

  static async createFromPedido(
    pedido: Pedido,
    paymentMethod: string,
    discount = 0,
    timezone = DEFAULT_TZ
  ): Promise<Venda> {
    await pedido.load('items', (query) => {
      query.preload('cardapioProduto')
    })
    await pedido.load('comanda')
    await pedido.load('user')

    const updatedPedido = await Pedido.findOrFail(pedido.id)
    updatedPedido.status = 'paid'
    updatedPedido.paidAt = DateTime.now().setZone(timezone)
    await updatedPedido.save()

    // Criar venda
    const saleNumber = await Venda.generateSaleNumber(updatedPedido.empresaId, timezone)

    const venda = await Venda.create({
      empresaId: updatedPedido.empresaId,
      pedidoId: updatedPedido.id,
      comandaId: updatedPedido.comandaId,
      userId: updatedPedido.userId,
      saleNumber,
      paymentMethod: paymentMethod as any,
      discount,
      saleDate: DateTime.now().setZone(timezone),
    })

    // Criar itens da venda
    for (const pedidoItem of updatedPedido.items) {
      await VendaItem.create({
        vendaId: venda.id,
        cardapioProdutoId: pedidoItem.cardapioProdutoId,
        pedidoItemId: pedidoItem.id,
        itemName: pedidoItem.itemName,
        unitPrice: pedidoItem.unitPrice,
        unitCost: pedidoItem.cardapioProduto?.costPrice || 0,
        quantity: pedidoItem.quantity,
        subtotal: pedidoItem.totalPrice,
        specialInstructions: pedidoItem.specialInstructions,
      })
    }

    await venda.calculateTotals()
    await venda.save()

    return await venda.refresh()
  }

  static async createFromComanda(
    comanda: Comanda,
    paymentMethod: string,
    userId: number,
    discountPercentage = 0,
    timezone = DEFAULT_TZ
  ): Promise<Venda> {
    const saleNumber = await Venda.generateSaleNumber(comanda.empresaId, timezone)

    // Garantir que o saleNumber é uma string
    if (typeof saleNumber !== 'string') {
      throw new Error(`saleNumber deve ser uma string, mas recebeu ${typeof saleNumber}: ${saleNumber}`)
    }

    console.log('[VENDA CREATE_FROM_COMANDA] Iniciando criação de venda a partir de comanda')
    console.log(`  - Comanda ID: ${comanda.id}`)
    console.log(`  - Sale Number: ${saleNumber}`)
    console.log(`  - Payment Method: ${paymentMethod}`)
    console.log(`  - Discount Percentage (raw): ${discountPercentage}`)
    console.log(`  - Discount Type: ${typeof discountPercentage}`)

    // Somar todas as taxas de serviço dos pedidos ativos
    const pedidosAtivos = comanda.pedidos.filter((pedido) =>
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(pedido.status)
    )
    const totalServiceCharge = pedidosAtivos.reduce(
      (sum, pedido) => sum + (Number(pedido.serviceCharge) || 0),
      0
    )

    console.log(`  - Pedidos Ativos: ${pedidosAtivos.length}`)
    console.log(`  - Total Service Charge: ${totalServiceCharge}`)

    // Criar venda com subtotal temporário para calcular desconto percentual
    let tempSubtotal = 0

    // Calcular subtotal dos itens
    const vendaItems: any[] = []
    for (const pedido of pedidosAtivos) {
      for (const item of pedido.items) {
        // Garantir que totalPrice seja convertido para número
        const itemTotal = Number(item.totalPrice) || 0
        tempSubtotal += itemTotal
        vendaItems.push({
          vendaId: undefined, // Será preenchido depois
          cardapioProdutoId: item.cardapioProdutoId,
          pedidoItemId: item.id,
          itemName: item.itemName,
          unitPrice: Number(item.unitPrice) || 0,
          unitCost: item.cardapioProduto?.costPrice || 0,
          quantity: Number(item.quantity) || 0,
          subtotal: itemTotal,
          specialInstructions: item.specialInstructions,
        })
      }
    }

    console.log(`  - Subtotal Temporário: ${tempSubtotal} (type: ${typeof tempSubtotal})`)

    // Calcular desconto em valor baseado no percentual
    const discountValue = (tempSubtotal * discountPercentage) / 100

    console.log(`  - Discount Calculation:`)
    console.log(`    - Formula: (${tempSubtotal} * ${discountPercentage}) / 100`)
    console.log(`    - Discount Value (final): ${discountValue}`)

    // Log detalhado dos valores antes de inserir
    console.log('[VENDA CREATE_FROM_COMANDA] Valores para inserção no banco:')
    console.log(`  - empresaId: ${comanda.empresaId} (type: ${typeof comanda.empresaId})`)
    console.log(`  - comandaId: ${comanda.id} (type: ${typeof comanda.id})`)
    console.log(`  - userId: ${userId} (type: ${typeof userId})`)
    console.log(`  - saleNumber: ${saleNumber} (type: ${typeof saleNumber})`)
    console.log(`  - paymentMethod: ${paymentMethod} (type: ${typeof paymentMethod})`)
    console.log(`  - subtotal: ${tempSubtotal} (type: ${typeof tempSubtotal})`)
    console.log(`  - discount: ${discountValue} (type: ${typeof discountValue})`)
    console.log(`  - tax: ${totalServiceCharge} (type: ${typeof totalServiceCharge})`)

    // Garantir que todos os valores numéricos sejam realmente números
    const subtotalNum = Number(tempSubtotal)
    const discountNum = Number(discountValue)
    const taxNum = Number(totalServiceCharge)

    console.log('[VENDA CREATE_FROM_COMANDA] Valores convertidos:')
    console.log(`  - subtotalNum: ${subtotalNum} (type: ${typeof subtotalNum}, isNaN: ${Number.isNaN(subtotalNum)})`)
    console.log(`  - discountNum: ${discountNum} (type: ${typeof discountNum}, isNaN: ${Number.isNaN(discountNum)})`)
    console.log(`  - taxNum: ${taxNum} (type: ${typeof taxNum}, isNaN: ${Number.isNaN(taxNum)})`)

    // Validar que nenhum valor é NaN
    if (Number.isNaN(subtotalNum) || Number.isNaN(discountNum) || Number.isNaN(taxNum)) {
      throw new Error(`Valores numéricos inválidos detectados: subtotal=${subtotalNum}, discount=${discountNum}, tax=${taxNum}`)
    }

    const venda = await Venda.create({
      empresaId: comanda.empresaId,
      comandaId: comanda.id,
      userId: userId,
      saleNumber,
      paymentMethod: paymentMethod as any,
      subtotal: subtotalNum,
      discount: discountNum,
      tax: taxNum,
      saleDate: DateTime.now().setZone(timezone),
    })

    console.log(`  - Venda criada | ID: ${venda.id} | Sale Number: ${venda.saleNumber}`)

    // Criar itens da venda
    for (const item of vendaItems) {
      await VendaItem.create({
        ...item,
        vendaId: venda.id,
      })
    }

    console.log(`  - ${vendaItems.length} itens de venda criados`)

    // Marcar pedidos como pago
    for (const pedido of pedidosAtivos) {
      pedido.status = 'paid'
      pedido.paidAt = DateTime.now().setZone(timezone)
      await pedido.save()
    }

    console.log(`  - ${pedidosAtivos.length} pedidos marcados como pagos`)

    await venda.calculateTotals()

    console.log(`  - Totais calculados:`)
    console.log(`    - Subtotal: ${venda.subtotal}`)
    console.log(`    - Discount: ${venda.discount}`)
    console.log(`    - Tax: ${venda.tax}`)
    console.log(`    - Total: ${venda.total}`)
    console.log(`    - Profit: ${venda.profit}`)
    console.log(`    - Profit Margin: ${venda.profitMargin}%`)

    await venda.save()

    // Marcar comanda como inativa
    comanda.active = false
    await comanda.save()

    console.log(`[VENDA CREATE_FROM_COMANDA] Sucesso | Venda ${venda.id} criada`)

    return await venda.refresh()
  }

  @computed()
  public get paymentMethodBadge() {
    const badges = {
      cash: { text: 'Dinheiro', class: 'bg-green-100 text-green-800' },
      card: { text: 'Cartão', class: 'bg-blue-100 text-blue-800' },
      pix: { text: 'PIX', class: 'bg-purple-100 text-purple-800' },
      split: { text: 'Misto', class: 'bg-orange-100 text-orange-800' },
    }
    const badge = badges[this.paymentMethod] || { text: 'N/D', class: 'bg-gray-100 text-gray-800' }
    console.log('[paymentMethodBadge] paymentMethod:', this.paymentMethod, '=>', badge)
    return badge
  }

  @computed()
  public get profitBadge() {
    if (typeof this.profitMargin !== 'number' || !Number.isFinite(this.profitMargin)) {
      console.log('[profitBadge] profitMargin inválido:', this.profitMargin)
      return { text: 'N/D', class: 'bg-gray-100 text-gray-800' }
    }

    let badge
    if (this.profitMargin >= 30) {
      badge = { text: 'Excelente', class: 'bg-green-100 text-green-800' }
    } else if (this.profitMargin >= 20) {
      badge = { text: 'Boa', class: 'bg-blue-100 text-blue-800' }
    } else if (this.profitMargin >= 10) {
      badge = { text: 'Regular', class: 'bg-yellow-100 text-yellow-800' }
    } else {
      badge = { text: 'Baixa', class: 'bg-red-100 text-red-800' }
    }
    console.log('[profitBadge] profitMargin:', this.profitMargin, '=>', badge)
    return badge
  }
}
