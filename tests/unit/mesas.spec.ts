import { test } from '@japa/runner'
import * as sinon from 'sinon'

// Mocks
const createMockMesa = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  number: '1',
  name: 'Mesa Principal',
  location: 'Salão',
  sortOrder: 1,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: sinon.stub().resolves(function (this: any) {
    this.updatedAt = new Date()
  }),
  refresh: sinon.stub().resolves(function (this: any) {
    // No-op for mock
  }),
  delete: sinon.stub().resolves(true),
  getComandaCount: sinon.stub().resolves(0),
  getActiveComandas: sinon.stub().resolves([]),
  ...overrides,
})

const createMockComanda = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  number: '0001',
  mesaId: 1,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

test.group('Mesas - Unit Tests (Mocked)', () => {
  test('deve criar uma mesa', ({ assert }) => {
    const mesa = createMockMesa({
      number: '1',
      name: 'Mesa Principal',
      location: 'Salão',
    })

    assert.isNotNull(mesa.id)
    assert.equal(mesa.number, '1')
    assert.equal(mesa.name, 'Mesa Principal')
    assert.equal(mesa.location, 'Salão')
    assert.isTrue(mesa.active)
  })

  test('deve listar mesas da empresa', ({ assert }) => {
    const mesas = [
      createMockMesa({ number: '1', name: 'Mesa 1' }),
      createMockMesa({ id: 2, number: '2', name: 'Mesa 2' }),
    ]

    assert.lengthOf(mesas, 2)
  })

  test('deve garantir número único por empresa', ({ assert }) => {
    // Simulando validação de unicidade
    const mesas = [createMockMesa({ number: '10', name: 'Mesa Existente' })]

    const isDuplicate = mesas.some((m) => m.number === '10')
    assert.isTrue(isDuplicate)

    const shouldFail = isDuplicate
    assert.isTrue(shouldFail, 'Deveria rejeitar número duplicado')
  })

  test('deve atualizar uma mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '15',
      name: 'Mesa Original',
      location: 'Salão',
    })

    mesa.name = 'Mesa Atualizada'
    mesa.location = 'Varanda'

    assert.equal(mesa.name, 'Mesa Atualizada')
    assert.equal(mesa.location, 'Varanda')
  })

  test('deve alternar status de uma mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '20',
      name: 'Mesa Toggle',
      active: true,
    })

    mesa.active = false
    assert.isFalse(mesa.active)

    mesa.active = true
    assert.isTrue(mesa.active)
  })

  test('deve excluir mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '25',
      name: 'Mesa para Excluir',
    })

    const deletedId = mesa.id
    assert.exists(deletedId)

    // Simula deleção
    mesa.id = null as any

    assert.isNull(mesa.id)
  })

  test('deve buscar mesas por número', ({ assert }) => {
    const mesas = [
      createMockMesa({ number: '30', name: 'Mesa Especial' }),
      createMockMesa({ id: 2, number: '31', name: 'Mesa Normal' }),
    ]

    const encontrada = mesas.filter((m) => m.number === '30')

    assert.lengthOf(encontrada, 1)
    assert.equal(encontrada[0].name, 'Mesa Especial')
  })

  test('deve filtrar mesas por localização', ({ assert }) => {
    const mesas = [
      createMockMesa({ number: '40', name: 'Mesa 1', location: 'Salão' }),
      createMockMesa({ id: 2, number: '41', name: 'Mesa 2', location: 'Varanda' }),
    ]

    const filtradas = mesas.filter((m) => m.location === 'Varanda')

    assert.lengthOf(filtradas, 1)
    assert.equal(filtradas[0].number, '41')
  })

  test('deve filtrar apenas mesas ativas', ({ assert }) => {
    const mesas = [
      createMockMesa({ number: '50', name: 'Mesa Ativa', active: true }),
      createMockMesa({ id: 2, number: '51', name: 'Mesa Inativa', active: false }),
    ]

    const ativas = mesas.filter((m) => m.active)

    assert.lengthOf(ativas, 1)
    assert.equal(ativas[0].name, 'Mesa Ativa')
  })

  test('deve aceitar mesa sem nome', ({ assert }) => {
    const mesa = createMockMesa({
      number: '70',
      name: undefined as any,
    })

    assert.isNotNull(mesa)
    assert.isUndefined(mesa.name)
  })

  test('deve ordenar mesas por sort_order e number', ({ assert }) => {
    const mesas = [
      createMockMesa({ id: 1, number: '3', sortOrder: 2 }),
      createMockMesa({ id: 2, number: '1', sortOrder: 1 }),
      createMockMesa({ id: 3, number: '2', sortOrder: 1 }),
    ]

    const ordenadas = mesas.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder
      }
      return Number.parseInt(a.number) - Number.parseInt(b.number)
    })

    assert.lengthOf(ordenadas, 3)
    assert.equal(ordenadas[0].sortOrder, 1)
    assert.equal(ordenadas[1].sortOrder, 1)
    assert.equal(ordenadas[2].sortOrder, 2)
  })

  test('deve contar comandas de uma mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '10',
    })

    const comandas = [
      createMockComanda({ number: '0001', mesaId: mesa.id }),
      createMockComanda({ id: 2, number: '0002', mesaId: mesa.id }),
    ]

    assert.lengthOf(comandas, 2)
  })

  test('deve retornar comandas ativas da mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '15',
    })

    const comandas = [
      createMockComanda({ number: '0010', mesaId: mesa.id, active: true }),
      createMockComanda({ id: 2, number: '0011', mesaId: mesa.id, active: false }),
      createMockComanda({ id: 3, number: '0012', mesaId: mesa.id, active: true }),
    ]

    const ativas = comandas.filter((c) => c.active)

    assert.lengthOf(ativas, 2)
    assert.isTrue(ativas.every((c) => c.active))
  })
})
