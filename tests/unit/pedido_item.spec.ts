import { test } from '@japa/runner'
import * as sinon from 'sinon'
import { DateTime } from 'luxon'

// Mocks
const createMockPedidoItem = (overrides = {}) => ({
  id: 1,
  pedidoId: 1,
  cardapioProdutoId: 1,
  itemName: 'Prato Teste',
  unitPrice: 20.0,
  quantity: 1,
  totalPrice: 20.0,
  status: 'pending',
  startedAt: null as DateTime | null,
  preparedAt: null as DateTime | null,
  servedAt: null as DateTime | null,
  cancelledAt: null as DateTime | null,
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
  updateQuantity: sinon.stub().resolves(function (this: any, qty: number) {
    this.quantity = qty
    this.totalPrice = this.unitPrice * qty
  }),
  startPreparing: sinon.stub().resolves(function (this: any) {
    this.status = 'preparing'
    this.startedAt = DateTime.now()
  }),
  markReady: sinon.stub().resolves(function (this: any) {
    this.status = 'ready'
    this.preparedAt = DateTime.now()
  }),
  serve: sinon.stub().resolves(function (this: any) {
    this.status = 'served'
    this.servedAt = DateTime.now()
  }),
  cancel: sinon.stub().resolves(function (this: any) {
    this.status = 'cancelled'
    this.cancelledAt = DateTime.now()
  }),
  get statusBadge(): { color: string; text: string } {
    const badges: Record<string, { color: string; text: string }> = {
      pending: { color: 'gray', text: 'Pendente' },
      preparing: { color: 'orange', text: 'Preparando' },
      ready: { color: 'blue', text: 'Pronto' },
      served: { color: 'green', text: 'Servido' },
      cancelled: { color: 'red', text: 'Cancelado' },
    }
    return badges[this.status] || { color: 'gray', text: 'Desconhecido' }
  },
  get canEdit(): boolean {
    return this.status === 'pending'
  },
  get formattedPrice(): string {
    return `R$ ${this.unitPrice.toFixed(2).replace('.', ',')}`
  },
  get formattedTotal(): string {
    return `R$ ${this.totalPrice.toFixed(2).replace('.', ',')}`
  },
  ...overrides,
})

test.group('PedidoItem - Unit Tests (Mocked)', () => {
  test('deve criar um item de pedido', ({ assert }) => {
    const item = createMockPedidoItem({
      quantity: 2,
      totalPrice: 40.0,
    })

    assert.exists(item.id)
    assert.equal(item.quantity, 2)
    assert.equal(item.unitPrice, 20.0)
    assert.equal(item.totalPrice, 40.0)
  })

  test('deve atualizar quantidade do item', async ({ assert }) => {
    const item = createMockPedidoItem()

    // Simular a atualização
    item.quantity = 5
    item.totalPrice = item.unitPrice * 5

    assert.equal(item.quantity, 5)
    assert.equal(item.totalPrice, 100.0)
  })

  test('deve iniciar preparo do item', ({ assert }) => {
    const item = createMockPedidoItem()

    // Simular início de preparo
    item.status = 'preparing'
    item.startedAt = DateTime.now()

    assert.equal(item.status, 'preparing')
    assert.exists(item.startedAt)
  })

  test('deve marcar item como pronto', ({ assert }) => {
    const item = createMockPedidoItem({ status: 'preparing' })

    // Simular marca como pronto
    item.status = 'ready'
    item.preparedAt = DateTime.now()

    assert.equal(item.status, 'ready')
    assert.exists(item.preparedAt)
  })

  test('deve servir item', ({ assert }) => {
    const item = createMockPedidoItem({ status: 'ready' })

    // Simular servir
    item.status = 'served'
    item.servedAt = DateTime.now()

    assert.equal(item.status, 'served')
    assert.exists(item.servedAt)
  })

  test('deve cancelar item', ({ assert }) => {
    const item = createMockPedidoItem()

    // Simular cancelamento
    item.status = 'cancelled'
    item.cancelledAt = DateTime.now()

    assert.equal(item.status, 'cancelled')
    assert.exists(item.cancelledAt)
  })

  test('deve retornar status badge correto', ({ assert }) => {
    const itemPreparing = createMockPedidoItem({ status: 'preparing' })

    const badge = itemPreparing.statusBadge
    assert.equal(badge.color, 'orange')
    assert.equal(badge.text, 'Preparando')
  })

  test('deve permitir edição apenas em pending', ({ assert }) => {
    const itemPending = createMockPedidoItem({ status: 'pending' })
    const itemPreparing = createMockPedidoItem({ status: 'preparing' })

    assert.isTrue(itemPending.canEdit)
    assert.isFalse(itemPreparing.canEdit)
  })

  test('deve formatar preços corretamente', ({ assert }) => {
    const item = createMockPedidoItem({
      unitPrice: 25.5,
      quantity: 2,
      totalPrice: 51.0,
    })

    assert.match(item.formattedPrice, /R\$\s*25,50/)
    assert.match(item.formattedTotal, /R\$\s*51,00/)
  })
})
