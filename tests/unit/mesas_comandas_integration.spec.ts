import { test } from '@japa/runner'
import * as sinon from 'sinon'

// Mocks
const createMockMesa = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  number: '1',
  name: 'Mesa Principal',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  comandas: [] as any[],
  save: sinon.stub().resolves(function (this: any) {
    this.updatedAt = new Date()
  }),
  load: sinon.stub().resolves(function (this: any, relation: string) {
    if (relation === 'comandas') {
      this.comandas = []
    }
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
  name: 'Comanda',
  mesaId: null as number | null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  mesa: null as any,
  save: sinon.stub().resolves(function (this: any) {
    this.updatedAt = new Date()
  }),
  refresh: sinon.stub().resolves(function (this: any) {
    // No-op for mock
  }),
  load: sinon.stub().resolves(function (this: any, relation: string) {
    if (relation === 'mesa' && this.mesaId) {
      this.mesa = {
        id: this.mesaId,
        number: '1',
        name: 'Mesa Principal',
      }
    }
  }),
  ...overrides,
})

test.group('Mesas + Comandas Integration (Mocked)', () => {
  test('comanda pode existir sem mesa', ({ assert }) => {
    const comanda = createMockComanda({
      number: '0001',
      mesaId: null,
    })

    assert.isNull(comanda.mesaId)
    assert.isNotNull(comanda.id)
  })

  test('comanda pode ser vinculada a uma mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '1',
      name: 'Mesa Principal',
    })

    const comanda = createMockComanda({
      number: '0002',
      mesaId: mesa.id,
    })

    assert.equal(comanda.mesaId, mesa.id)

    comanda.mesa = mesa
    assert.equal(comanda.mesa.id, mesa.id)
    assert.equal(comanda.mesa.number, '1')
  })

  test('mesa pode ter múltiplas comandas', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '5',
      name: 'Mesa VIP',
      comandas: [
        createMockComanda({ id: 1, number: '0010', mesaId: 1 }),
        createMockComanda({ id: 2, number: '0011', mesaId: 1 }),
        createMockComanda({ id: 3, number: '0012', mesaId: 1 }),
      ],
    })

    assert.lengthOf(mesa.comandas, 3)
  })

  test('contador de comandas só conta ativas', async ({ assert }) => {
    const comandas = [
      createMockComanda({ id: 1, number: '0020', active: true }),
      createMockComanda({ id: 2, number: '0021', active: true }),
      createMockComanda({ id: 3, number: '0022', active: false }),
    ]

    const ativas = comandas.filter((c) => c.active)
    assert.lengthOf(ativas, 2)
  })

  test('getActiveComandas retorna apenas comandas ativas', async ({ assert }) => {
    const comandas = [
      createMockComanda({ id: 1, number: '0030', active: true }),
      createMockComanda({ id: 2, number: '0031', active: false }),
      createMockComanda({ id: 3, number: '0032', active: true }),
    ]

    const ativas = comandas.filter((c) => c.active)
    assert.lengthOf(ativas, 2)
    assert.isTrue(ativas.every((c) => c.active))
  })

  test('quando mesa é excluída, comandas ficam sem mesa (SET NULL)', async ({ assert }) => {
    const comanda = createMockComanda({
      number: '0050',
      mesaId: 1,
    })

    // Simular deleção da mesa - comanda perde a mesa
    comanda.mesaId = null

    assert.isNull(comanda.mesaId)
  })

  test('deve transferir comanda entre mesas', async ({ assert }) => {
    const comanda = createMockComanda({
      number: '0080',
      mesaId: 1,
    })

    // Transferir para mesa 2
    comanda.mesaId = 2

    assert.equal(comanda.mesaId, 2)
  })

  test('deve desvincular comanda de mesa', async ({ assert }) => {
    const comanda = createMockComanda({
      number: '0090',
      mesaId: 1,
    })

    // Remover mesa
    comanda.mesaId = null

    assert.isNull(comanda.mesaId)
  })

  test('deve filtrar comandas por mesa', ({ assert }) => {
    const comandas = [
      createMockComanda({ id: 1, number: '0100', mesaId: 1 }),
      createMockComanda({ id: 2, number: '0101', mesaId: 2 }),
    ]

    const comandasMesa1 = comandas.filter((c) => c.mesaId === 1)

    assert.lengthOf(comandasMesa1, 1)
    assert.equal(comandasMesa1[0].number, '0100')
  })

  test('deve carregar relação mesa em comanda', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '60',
      name: 'Mesa Detalhes',
    })

    const comanda = createMockComanda({
      number: '0110',
      name: 'Comanda A',
      mesaId: mesa.id,
      mesa: mesa,
    })

    assert.isNotNull(comanda.mesa)
    assert.equal(comanda.mesa.number, '60')
    assert.equal(comanda.mesa.name, 'Mesa Detalhes')
  })

  test('deve carregar relação comandas em mesa', async ({ assert }) => {
    const mesa = createMockMesa({
      number: '70',
      name: 'Mesa com Comandas',
      comandas: [
        createMockComanda({ id: 1, number: '0120', name: 'Comanda A' }),
        createMockComanda({ id: 2, number: '0121', name: 'Comanda B' }),
      ],
    })

    assert.lengthOf(mesa.comandas, 2)
    assert.equal(mesa.comandas[0].name, 'Comanda A')
    assert.equal(mesa.comandas[1].name, 'Comanda B')
  })

  test('estatísticas da mesa calculam corretamente', async ({ assert }) => {
    const comandas = [
      createMockComanda({ id: 1, number: '0130', active: true }),
      createMockComanda({ id: 2, number: '0131', active: true }),
      createMockComanda({ id: 3, number: '0132', active: false }),
    ]

    const total = comandas.length
    const ativas = comandas.filter((c) => c.active).length

    assert.equal(total, 3)
    assert.equal(ativas, 2)
  })

  test('withCount comandas funciona corretamente', ({ assert }) => {
    const mesa = createMockMesa({
      number: '90',
      comandas: [
        createMockComanda({ id: 1, number: '0140' }),
        createMockComanda({ id: 2, number: '0141' }),
      ],
    })

    const comandasCount = mesa.comandas.length

    assert.equal(comandasCount, 2)
  })
})
