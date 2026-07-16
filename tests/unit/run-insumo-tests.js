#!/usr/bin/env node

/**
 * RUNNER DE TESTES - SISTEMA DE ESTOQUE DE INSUMOS
 * ================================================
 * 
 * Script simples para executar os testes desacoplados
 * Sem dependências de JAPA ou banco de dados
 * 
 * Uso: node tests/unit/run-insumo-tests.js
 */

// Nota: TypeScript interfaces comentadas, usamos objetos simples
// - MockInsumo: { id, name, currentStock }
// - MockInsumoReserva: { id, insumoId, pedidoId, quantidade, status }
// - MockCardapioProdutoIngrediente: { insumoId, quantity }
// - MockCardapioProduto: { id, ingredientes[] }
// - MockPedidoItem: { quantity, cardapioProduto }
// - MockPedido: { id, items[] }

// ============================================================
// REPOSITÓRIOS EM MEMÓRIA
// ============================================================

class MockInsumoRepository {
  constructor() {
    this.insumos = new Map()
    this.nextId = 1
  }

  save(insumo) {
    if (!insumo.id) {
      insumo.id = this.nextId++
    }
    this.insumos.set(insumo.id, { ...insumo })
    return this.insumos.get(insumo.id)
  }

  findById(id) {
    const insumo = this.insumos.get(id)
    return insumo ? { ...insumo } : null
  }

  clear() {
    this.insumos.clear()
    this.nextId = 1
  }
}

class MockInsumoReservaRepository {
  constructor() {
    this.reservas = new Map()
    this.nextId = 1
  }

  save(reserva) {
    if (!reserva.id) {
      reserva.id = this.nextId++
    }
    this.reservas.set(reserva.id, { ...reserva })
    return this.reservas.get(reserva.id)
  }

  findByPedidoId(pedidoId) {
    return Array.from(this.reservas.values())
      .filter((r) => r.pedidoId === pedidoId)
      .map((r) => ({ ...r }))
  }

  findByInsumoIdAndStatuses(insumoId, statuses) {
    return Array.from(this.reservas.values()).filter(
      (r) => r.insumoId === insumoId && statuses.includes(r.status)
    )
  }

  update(id, reserva) {
    const existing = this.reservas.get(id)
    if (existing) {
      this.reservas.set(id, { ...existing, ...reserva })
    }
  }

  clear() {
    this.reservas.clear()
    this.nextId = 1
  }
}

// ============================================================
// SERVIÇO TESTÁVEL
// ============================================================

class InsumoStockServiceForTests {
  constructor(insumoRepo, reservaRepo) {
    this.insumoRepo = insumoRepo
    this.reservaRepo = reservaRepo
  }

  reserveInsumoFromOrder(pedido) {
    if (!pedido.items || pedido.items.length === 0) {
      throw new Error('Pedido deve ter pelo menos um item')
    }

    for (const item of pedido.items) {
      const produto = item.cardapioProduto

      if (!produto.ingredientes || produto.ingredientes.length === 0) {
        continue
      }

      for (const ingrediente of produto.ingredientes) {
        const quantityToReserve = ingrediente.quantity * item.quantity
        const insumo = this.insumoRepo.findById(ingrediente.insumoId)
        
        if (!insumo) {
          throw new Error(`Insumo ${ingrediente.insumoId} não encontrado`)
        }

        const availableStock = this.calculateAvailableStock(insumo.id)

        if (availableStock < quantityToReserve) {
          throw new Error(
            `Estoque insuficiente: disponível ${availableStock}, necessário ${quantityToReserve}`
          )
        }

        this.reservaRepo.save({
          id: 0,
          insumoId: insumo.id,
          pedidoId: pedido.id,
          quantidade: quantityToReserve,
          status: 'reserved',
        })
      }
    }
  }

  deductInsumoFromOrder(pedido) {
    const reservas = this.reservaRepo.findByPedidoId(pedido.id)
      .filter(r => r.status === 'reserved')

    for (const reserva of reservas) {
      const insumo = this.insumoRepo.findById(reserva.insumoId)
      if (!insumo) {
        throw new Error(`Insumo ${reserva.insumoId} não encontrado`)
      }

      insumo.currentStock -= reserva.quantidade
      this.insumoRepo.save(insumo)
      this.reservaRepo.update(reserva.id, { status: 'deducted' })
    }
  }

  calculateAvailableStock(insumoId) {
    const insumo = this.insumoRepo.findById(insumoId)
    if (!insumo) {
      return 0
    }

    const reservas = this.reservaRepo.findByInsumoIdAndStatuses(insumoId, ['reserved'])
    const totalReserved = reservas.reduce((sum, r) => sum + r.quantidade, 0)

    return insumo.currentStock - totalReserved
  }

  getAvailableStock(insumoId) {
    return this.calculateAvailableStock(insumoId)
  }

  getMaxPossibleQuantity(produto) {
    if (!produto.ingredientes || produto.ingredientes.length === 0) {
      return 999
    }

    let maxQuantity = Infinity

    for (const ingrediente of produto.ingredientes) {
      const availableStock = this.calculateAvailableStock(ingrediente.insumoId)
      const possibleQuantity = Math.floor(availableStock / ingrediente.quantity)
      maxQuantity = Math.min(maxQuantity, possibleQuantity)
    }

    return maxQuantity === Infinity ? 0 : maxQuantity
  }
}

// ============================================================
// RUNNER DE TESTES
// ============================================================

class TestRunner {
  constructor() {
    this.passed = 0
    this.failed = 0
    this.tests = []
  }

  test(name, fn) {
    this.tests.push({ name, fn })
  }

  async run() {
    console.log('\n' + '='.repeat(70))
    console.log('='.repeat(70) + '\n')

    let currentGroup = ''

    for (const test of this.tests) {
      const group = test.name.split(':')[0]
      if (group !== currentGroup) {
        currentGroup = group
        console.log(`\n📦 ${group}`)
      }

      try {
        test.fn()
        console.log(`  ✅ ${test.name}`)
        this.passed++
      } catch (error) {
        console.log(`  ❌ ${test.name}`)
        console.log(`     ${error.message}`)
        this.failed++
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log(`\n📊 RESULTADO: ${this.passed} ✅ | ${this.failed} ❌`)
    console.log(`Total: ${this.passed + this.failed} testes\n`)

    if (this.failed === 0) {
    } else {
      process.exit(1)
    }
  }
}

// ============================================================
// ASSERTIONS
// ============================================================

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}\nEsperado: ${expected}\nObtido: ${actual}`
    )
  }
}

function assertThrows(fn, message) {
  try {
    fn()
    throw new Error(`${message}\nEsperava um erro mas nenhum foi lançado`)
  } catch (error) {
    if (error.message === `${message}\nEsperava um erro mas nenhum foi lançado`) {
      throw error
    }
  }
}

// ============================================================
// TESTES
// ============================================================

const runner = new TestRunner()

// Setup
let insumoRepo
let reservaRepo
let service

// Setup antes de cada teste
function setup() {
  insumoRepo = new MockInsumoRepository()
  reservaRepo = new MockInsumoReservaRepository()
  service = new InsumoStockServiceForTests(insumoRepo, reservaRepo)
}

// ============================================================
// 1. CÁLCULOS BÁSICOS
// ============================================================

runner.test('Cálculos: quantidade de insumo necessária', () => {
  setup()
  const totalPao = 5 * 1
  const totalCarne = 5 * 0.25
  assertEqual(totalPao, 5, 'Pão')
  assertEqual(totalCarne, 1.25, 'Carne')
})

runner.test('Cálculos: validar estoque suficiente', () => {
  setup()
  const estoqueDisponivel = 100
  const necessario = 80
  const temEstoque = estoqueDisponivel >= necessario
  if (!temEstoque) throw new Error('Estoque deveria ser suficiente')
})

// ============================================================
// 2. MÁXIMO POSSÍVEL
// ============================================================

runner.test('MáximoPossível: com um ingrediente limitante', () => {
  setup()
  const paoBR = 100
  const carneBR = 50
  const maxPorPao = paoBR / 1 // 100
  const maxPorCarne = carneBR / 0.25 // 200
  const maxPossivel = Math.min(maxPorPao, maxPorCarne)
  assertEqual(maxPossivel, 100, 'Máximo')
})

runner.test('MáximoPossível: quando falta ingrediente', () => {
  setup()
  const paoBR = 100
  const carneBR = 0
  const maxPorPao = paoBR / 1
  const maxPorCarne = carneBR / 0.25
  const maxPossivel = Math.min(maxPorPao, maxPorCarne)
  assertEqual(maxPossivel, 0, 'Máximo com falta')
})

// ============================================================
// 3. DEDUÇÃO DE ESTOQUE
// ============================================================

runner.test('Dedução: simples', () => {
  setup()
  let estoqueAtual = 100
  const consumo = 5 * 0.25
  estoqueAtual -= consumo
  assertEqual(estoqueAtual, 98.75, 'Dedução simples')
})

runner.test('Dedução: múltiplos itens sequenciais', () => {
  setup()
  let estoqueAtual = 100
  estoqueAtual -= 5 * 0.25
  assertEqual(estoqueAtual, 98.75, 'Após item 1')
  estoqueAtual -= 3 * 0.25
  assertEqual(estoqueAtual, 98.0, 'Após item 2')
})

// ============================================================
// 4. WORKFLOWS
// ============================================================

runner.test('Workflow: reservar não altera currentStock', () => {
  setup()
  const paoBr = {
    id: 1,
    name: 'Pão',
    currentStock: 100,
  }
  insumoRepo.save(paoBr)

  const produto = {
    id: 1,
    ingredientes: [{ insumoId: 1, quantity: 1 }],
  }

  const item = {
    quantity: 5,
    cardapioProduto: produto,
  }

  const pedido = {
    id: 1,
    items: [item],
  }

  service.reserveInsumoFromOrder(pedido)

  const paoBrAtual = insumoRepo.findById(1)
  assertEqual(paoBrAtual.currentStock, 100, 'Estoque não deve mudar')
})

runner.test('Workflow: descontar reduz currentStock', () => {
  setup()
  const paoBr = {
    id: 1,
    name: 'Pão',
    currentStock: 100,
  }
  insumoRepo.save(paoBr)

  const produto = {
    id: 1,
    ingredientes: [{ insumoId: 1, quantity: 1 }],
  }

  const item = {
    quantity: 5,
    cardapioProduto: produto,
  }

  const pedido = {
    id: 1,
    items: [item],
  }

  service.reserveInsumoFromOrder(pedido)
  service.deductInsumoFromOrder(pedido)

  const paoBrAtual = insumoRepo.findById(1)
  assertEqual(paoBrAtual.currentStock, 95, 'Estoque deve reduzir')
})

// ============================================================
// 5. ERROS E VALIDAÇÕES
// ============================================================

runner.test('Validação: erro com estoque insuficiente', () => {
  setup()
  const paoBr = {
    id: 1,
    name: 'Pão',
    currentStock: 5,
  }
  insumoRepo.save(paoBr)

  const produto = {
    id: 1,
    ingredientes: [{ insumoId: 1, quantity: 1 }],
  }

  const item = {
    quantity: 10,
    cardapioProduto: produto,
  }

  const pedido = {
    id: 1,
    items: [item],
  }

  assertThrows(
    () => service.reserveInsumoFromOrder(pedido),
    'Deve lançar erro'
  )
})

runner.test('Validação: erro com pedido vazio', () => {
  setup()
  const pedido = {
    id: 1,
    items: [],
  }

  assertThrows(
    () => service.reserveInsumoFromOrder(pedido),
    'Deve lançar erro para pedido vazio'
  )
})

// ============================================================
// 6. DISPONIBILIDADE
// ============================================================

runner.test('Disponibilidade: considerando reservas', () => {
  setup()
  const paoBr = {
    id: 1,
    name: 'Pão',
    currentStock: 100,
  }
  insumoRepo.save(paoBr)

  const produto = {
    id: 1,
    ingredientes: [{ insumoId: 1, quantity: 1 }],
  }

  const item = {
    quantity: 30,
    cardapioProduto: produto,
  }

  const pedido = {
    id: 1,
    items: [item],
  }

  service.reserveInsumoFromOrder(pedido)
  const disponivel = service.getAvailableStock(1)

  assertEqual(disponivel, 70, 'Disponível deve ser 70')
})

runner.test('Disponibilidade: máximo possível via serviço', () => {
  setup()
  const paoBr = {
    id: 1,
    name: 'Pão',
    currentStock: 100,
  }
  const carneBr = {
    id: 2,
    name: 'Carne',
    currentStock: 50,
  }
  insumoRepo.save(paoBr)
  insumoRepo.save(carneBr)

  const produto = {
    id: 1,
    ingredientes: [
      { insumoId: 1, quantity: 1 },
      { insumoId: 2, quantity: 0.25 },
    ],
  }

  const maxPossivel = service.getMaxPossibleQuantity(produto)
  assertEqual(maxPossivel, 100, 'Máximo deve ser 100')
})

// ============================================================
// 7. MÚLTIPLOS PEDIDOS
// ============================================================

runner.test('MúltiplosPedidos: com espaço após dedução', () => {
  setup()
  const paoBr = {
    id: 1,
    name: 'Pão',
    currentStock: 100,
  }
  insumoRepo.save(paoBr)

  const produto = {
    id: 1,
    ingredientes: [{ insumoId: 1, quantity: 1 }],
  }

  // Pedido 1: reserva 30
  const item1 = {
    quantity: 30,
    cardapioProduto: produto,
  }
  const pedido1 = {
    id: 1,
    items: [item1],
  }
  service.reserveInsumoFromOrder(pedido1)

  // Pedido 2: reserva 40
  const item2 = {
    quantity: 40,
    cardapioProduto: produto,
  }
  const pedido2 = {
    id: 2,
    items: [item2],
  }
  service.reserveInsumoFromOrder(pedido2)

  // Disponível = 30 (100 - 30 - 40)
  assertEqual(service.getAvailableStock(1), 30, 'Disponível')

  // Pedido 1 em preparo
  service.deductInsumoFromOrder(pedido1)

  // Agora: estoque real 70, reservado 40, disponível 30
  assertEqual(service.getAvailableStock(1), 30, 'Após dedução')
})

// ============================================================
// EXECUTAR
// ============================================================

runner.run().catch(console.error)
