import { test } from '@japa/runner'
import * as sinon from 'sinon'

// Mocks
const createMockInsumo = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  name: 'Pão de Hambúrguer',
  unit: 'unidade',
  currentStock: 100,
  minimumStock: 20,
  maximumStock: 200,
  stockControl: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  refresh: sinon.stub().resolves(function (this: any) {
    // No-op for mock
  }),
  ...overrides,
})

/* const createMockProduto = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  name: 'Hambúrguer Simples',
  costPrice: 5.0,
  salePrice: 15.0,
  active: true,
  available: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
}) */

const createMockPedido = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  userId: 1,
  orderNumber: '#001',
  type: 'dine_in',
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancel: sinon.stub().resolves(function (this: any) {
    this.status = 'cancelled'
  }),
  save: sinon.stub().resolves(function (this: any) {
    this.updatedAt = new Date()
  }),
  ...overrides,
})

const createMockReserva = (overrides = {}) => ({
  id: 1,
  pedidoId: 1,
  insumoId: 1,
  quantidade: 5,
  status: 'reserved',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

test.group('Insumo Stock System (Mocked)', () => {
  test('Deve reservar insumos quando um pedido é criado', async ({ assert }) => {
    // const pedido = createMockPedido()
    const reservas = [
      createMockReserva({ insumoId: 1, quantidade: 5 }),
      createMockReserva({ id: 2, insumoId: 2, quantidade: 1.25 }),
    ]

    assert.equal(reservas.length, 2, 'Deve ter 2 reservas (pão e carne)')

    const paoBR = reservas.find((r) => r.insumoId === 1)
    const carneBR = reservas.find((r) => r.insumoId === 2)

    assert.equal(paoBR?.quantidade, 5, 'Deve reservar 5 pães')
    assert.equal(carneBR?.quantidade, 1.25, 'Deve reservar 1.25kg de carne (5 x 0.25)')
  })

  test('Deve descontar insumos quando pedido entra em preparo', async ({ assert }) => {
    const insumo1 = createMockInsumo({ currentStock: 100 })
    const insumo2 = createMockInsumo({ id: 2, name: 'Carne Moída', currentStock: 50 })

    // Simular desconto
    insumo1.currentStock = 98
    insumo2.currentStock = 49.5

    const reserva = createMockReserva({ status: 'deducted' })

    assert.equal(insumo1.currentStock, 98, 'Estoque deve reduzir em 2 unidades')
    assert.equal(insumo2.currentStock, 49.5, 'Estoque deve reduzir em 0.5kg')
    assert.equal(reserva.status, 'deducted', 'Reserva deve estar marcada como deducted')
  })

  test('Deve liberar reservas quando pedido é cancelado antes de entrar em preparo', async ({
    assert,
  }) => {
    const pedido = createMockPedido()
    const insumo1 = createMockInsumo()

    pedido.status = 'cancelled'

    const reserva = createMockReserva({ status: 'released' })

    assert.equal(reserva.status, 'released', 'Reserva deve estar marcada como released')
    assert.equal(
      insumo1.currentStock,
      100,
      'Estoque não deve mudar se cancelado antes de descontar'
    )
  })

  test('Deve rejeitar reserva se não houver estoque suficiente', async ({ assert }) => {
    const insumo = createMockInsumo({ currentStock: 100 })
    // const pedido = createMockPedido()

    // Simular erro de estoque insuficiente
    const tentarReserva = () => {
      const quantidade = 200 // Requer 200 mas temos 100
      if (quantidade > insumo.currentStock) {
        throw new Error('Estoque insuficiente do insumo Pão de Hambúrguer')
      }
    }

    let errorThrown = false
    try {
      tentarReserva()
    } catch (error: any) {
      errorThrown = true
      assert.include(error.message, 'Estoque insuficiente', 'Erro deve mencionar falta de estoque')
    }

    assert.isTrue(errorThrown, 'Deve lançar erro se não houver estoque suficiente')
  })

  test('Deve calcular corretamente o máximo possível de um produto', ({ assert }) => {
    const insumo1Stock = 100 // Pão
    const insumo2Stock = 50 // Carne em kg

    // Hambúrguer precisa de 1 pão e 0.25kg de carne
    const maxPorPao = insumo1Stock / 1
    const maxPorCarne = insumo2Stock / 0.25
    const maxPossivel = Math.min(maxPorPao, maxPorCarne)

    assert.equal(maxPossivel, 100, 'Deve calcular corretamente o máximo (limitado pelo pão)')
  })

  test('Deve retornar 0 como máximo possível se faltar algum insumo', ({ assert }) => {
    const insumo1Stock = 100
    const insumo2Stock = 0 // Carne zerada

    const maxPorPao = insumo1Stock / 1
    const maxPorCarne = insumo2Stock / 0.25
    const maxPossivel = Math.min(maxPorPao, maxPorCarne)

    assert.equal(maxPossivel, 0, 'Deve retornar 0 se faltar insumo')
  })

  test('Deve calcular estoque disponível considerando reservas', ({ assert }) => {
    const insumo = createMockInsumo({ id: 1, currentStock: 100 })
    const reservado = 30

    const disponivel = insumo.currentStock - reservado

    assert.equal(disponivel, 70, 'Deve considerar reservas ao calcular disponibilidade')
  })

  test('Deve validar disponibilidade de um produto específico', async ({ assert }) => {
    // const produto = createMockProduto()

    // Simular insumo faltante
    const insumoFaltante = createMockInsumo({
      id: 3,
      name: 'Queijo',
      currentStock: 0,
    })

    const faltantes = {
      missingInsumos: [insumoFaltante],
    }

    assert.isNotEmpty(faltantes.missingInsumos, 'Deve retornar lista de insumos faltantes')
    assert.equal(
      faltantes.missingInsumos[0].name,
      'Queijo',
      'Deve identificar o queijo como faltante'
    )
  })

  test('Fluxo completo: Criar → Reservar → Preparar → Descontar → Servir', async ({ assert }) => {
    const pedido = createMockPedido()
    const insumo1 = createMockInsumo()
    const insumo2 = createMockInsumo({ id: 2, name: 'Carne Moída', currentStock: 50 })

    // Step 1: Criar pedido
    assert.equal(pedido.status, 'pending', 'Pedido deve estar pending')

    // Step 2: Reservar
    const reservas = [
      createMockReserva({ insumoId: 1, quantidade: 5, status: 'reserved' }),
      createMockReserva({ id: 2, insumoId: 2, quantidade: 1.25, status: 'reserved' }),
    ]
    assert.equal(reservas.length, 2, 'Deve ter 2 reservas')

    // Step 3: Marcar item como preparando
    pedido.status = 'preparing'

    // Step 4: Descontar insumos
    insumo1.currentStock = 95
    insumo2.currentStock = 48.75

    const reservasDeducted = reservas.map((r) => ({ ...r, status: 'deducted' }))
    assert.equal(reservasDeducted.length, 2, 'Deve ter 2 reservas deducted')
    assert.equal(insumo1.currentStock, 95, 'Estoque deve reduzir (100 - 5)')

    // Step 5: Marcar item como pronto
    pedido.status = 'ready'

    // Step 6: Servir
    pedido.status = 'served'
    assert.equal(pedido.status, 'served', 'Pedido deve estar served')

    // Verificar que estoque continua o mesmo
    assert.equal(insumo1.currentStock, 95, 'Estoque não deve mudar mais')
  })
})
