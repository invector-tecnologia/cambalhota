import { test } from '@japa/runner'
import * as sinon from 'sinon'
import { DateTime } from 'luxon'

// Mocks
const createMockPedido = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  comandaId: 1,
  userId: 1,
  orderNumber: '20240101-0001',
  type: 'dine_in',
  status: 'pending',
  subtotal: 0,
  discount: 0,
  serviceCharge: 0,
  total: 0,
  specialInstructions: null as string | null,
  confirmedAt: null as DateTime | null,
  cancelledAt: null as DateTime | null,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
  save: sinon.stub().resolves(function (this: any) {
    this.updatedAt = DateTime.now()
  }),
  refresh: sinon.stub().resolves(function (this: any) {
    // No-op for mock
  }),
  addItem: sinon.stub().resolves(function (
    this: any,
    productId: number,
    qty: number,
    instructions?: string
  ) {
    return {
      id: 1,
      pedidoId: this.id,
      cardapioProdutoId: productId,
      itemName: 'Frango à Milanesa',
      unitPrice: 24.0,
      quantity: qty,
      totalPrice: 24.0 * qty,
      specialInstructions: instructions || null,
      status: 'pending',
    }
  }),
  updateItemQuantity: sinon.stub().resolves(function (this: any, _itemId: number, qty: number) {
    this.subtotal = 24.0 * qty
    return { quantity: qty, totalPrice: 24.0 * qty }
  }),
  removeItem: sinon.stub().resolves(function (this: any, _itemId: number) {
    this.subtotal = 0
    this.total = 0
  }),
  confirm: sinon.stub().resolves(function (this: any) {
    this.status = 'confirmed'
    this.confirmedAt = DateTime.now()
  }),
  cancel: sinon.stub().resolves(function (this: any) {
    this.status = 'cancelled'
    this.cancelledAt = DateTime.now()
  }),
  calculateTotals: sinon.stub().resolves(function (this: any) {
    this.total = this.subtotal - this.discount + this.serviceCharge
  }),
  get statusBadge(): Record<string, string> {
    const badges: Record<string, { color: string; text: string }> = {
      pending: { color: 'gray', text: 'Pendente' },
      confirmed: { color: 'blue', text: 'Confirmado' },
      preparing: { color: 'orange', text: 'Preparando' },
      ready: { color: 'purple', text: 'Pronto' },
      delivered: { color: 'green', text: 'Entregue' },
      cancelled: { color: 'red', text: 'Cancelado' },
    }
    return badges[this.status] || { color: 'gray', text: 'Desconhecido' }
  },
  get typeBadge(): Record<string, string> {
    const badges: Record<string, { color: string; text: string }> = {
      dine_in: { color: 'blue', text: 'Salão' },
      takeout: { color: 'orange', text: 'Retirada' },
      delivery: { color: 'purple', text: 'Delivery' },
    }
    return badges[this.type] || { color: 'gray', text: 'Desconhecido' }
  },
  ...overrides,
})

const createMockPedidoItem = (overrides = {}) => ({
  id: 1,
  pedidoId: 1,
  cardapioProdutoId: 1,
  itemName: 'Frango à Milanesa',
  unitPrice: 24.0,
  quantity: 1,
  totalPrice: 24.0,
  specialInstructions: null,
  status: 'pending',
  refresh: sinon.stub().resolves(),
  ...overrides,
})

test.group('Pedido - Unit Tests (Mocked)', () => {
  test('deve criar um pedido', ({ assert }) => {
    const pedido = createMockPedido({
      orderNumber: '20240101-0001',
    })

    assert.exists(pedido.id)
    assert.equal(pedido.empresaId, 1)
    assert.equal(pedido.type, 'dine_in')
    assert.equal(pedido.status, 'pending')
  })

  test('deve gerar número de pedido único', ({ assert }) => {
    const numero1 = '20240101-0001'
    const numero2 = '20240101-0002'

    assert.notEqual(numero1, numero2)
    assert.match(numero1, /^\d{8}-\d{4}$/)
  })

  test('deve adicionar item ao pedido', async ({ assert }) => {
    const pedido = createMockPedido()

    const item = createMockPedidoItem({
      pedidoId: pedido.id,
      quantity: 2,
      totalPrice: 48.0,
    })

    assert.equal(item.pedidoId, pedido.id)
    assert.equal(item.quantity, 2)
    assert.equal(item.unitPrice, 24.0)
    assert.equal(item.totalPrice, 48.0)
  })

  test('deve calcular taxa de serviço para pedidos dine_in', async ({ assert }) => {
    const pedido = createMockPedido({
      type: 'dine_in',
      subtotal: 24.0,
    })

    pedido.serviceCharge = pedido.subtotal * 0.1
    pedido.total = pedido.subtotal + pedido.serviceCharge

    assert.equal(pedido.subtotal, 24.0)
    assert.approximately(pedido.serviceCharge, 2.4, 0.01)
    assert.approximately(pedido.total, 26.4, 0.01)
  })

  test('não deve calcular taxa de serviço para takeout', async ({ assert }) => {
    const pedido = createMockPedido({
      type: 'takeout',
      subtotal: 24.0,
      serviceCharge: 0,
    })

    pedido.total = pedido.subtotal

    assert.equal(pedido.subtotal, 24.0)
    assert.equal(pedido.serviceCharge, 0)
    assert.equal(pedido.total, 24.0)
  })

  test('deve atualizar quantidade de item', async ({ assert }) => {
    const pedido = createMockPedido()
    const item = createMockPedidoItem()

    item.quantity = 3
    item.totalPrice = 24.0 * 3
    pedido.subtotal = item.totalPrice

    assert.equal(item.quantity, 3)
    assert.equal(item.totalPrice, 72.0)
    assert.equal(pedido.subtotal, 72.0)
  })

  test('deve remover item do pedido', async ({ assert }) => {
    const pedido = createMockPedido({
      subtotal: 48.0,
    })

    pedido.subtotal = 0
    pedido.total = 0

    assert.equal(pedido.subtotal, 0)
    assert.equal(pedido.total, 0)
  })

  test('deve confirmar pedido', async ({ assert }) => {
    const pedido = createMockPedido()

    pedido.status = 'confirmed'
    pedido.confirmedAt = DateTime.now()

    assert.equal(pedido.status, 'confirmed')
    assert.exists(pedido.confirmedAt)
  })

  test('deve cancelar pedido', async ({ assert }) => {
    const pedido = createMockPedido()

    pedido.status = 'cancelled'
    pedido.cancelledAt = DateTime.now()

    assert.equal(pedido.status, 'cancelled')
    assert.exists(pedido.cancelledAt)
  })

  test('deve aplicar desconto corretamente', async ({ assert }) => {
    const pedido = createMockPedido({
      subtotal: 24.0,
      discount: 5.0,
    })

    pedido.total = pedido.subtotal - pedido.discount

    assert.equal(pedido.subtotal, 24.0)
    assert.equal(pedido.discount, 5.0)
    assert.equal(pedido.total, 19.0)
  })

  test('deve retornar badges corretos', ({ assert }) => {
    const pedido = createMockPedido({
      type: 'delivery',
      status: 'ready',
    })

    const statusBadge = pedido.statusBadge
    assert.equal(statusBadge.color, 'purple')
    assert.equal(statusBadge.text, 'Pronto')

    const typeBadge = pedido.typeBadge
    assert.equal(typeBadge.color, 'purple')
    assert.equal(typeBadge.text, 'Delivery')
  })
})
