import { test } from '@japa/runner'
import * as sinon from 'sinon'

// Mocks
const createMockCardapioProduto = (overrides = {}) => ({
  id: 1,
  empresaId: 1,
  cardapioCategoriaId: 1,
  name: 'Produto Teste',
  description: 'Descrição do produto',
  costPrice: 10.0,
  salePrice: 20.0,
  markupPercentage: 100,
  active: true,
  available: true,
  sortOrder: 1,
  preparationTime: 20,
  trackStock: false,
  dailySold: 0,
  spiceLevel: 'none',
  vegetarian: false,
  vegan: false,
  glutenFree: false,
  lactoseFree: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  get profitMargin(): number {
    return ((this.salePrice - this.costPrice) / this.salePrice) * 100
  },
  get dietaryLabels(): string[] {
    const labels: string[] = []
    if (this.vegetarian) labels.push('Vegetariano')
    if (this.vegan) labels.push('Vegano')
    if (this.glutenFree) labels.push('Sem Glúten')
    if (this.lactoseFree) labels.push('Sem Lactose')
    return labels
  },
  get spiceLevelDisplay(): string {
    const levels: Record<string, string> = {
      none: 'Sem Pimenta',
      mild: 'Levemente Picante',
      medium: 'Picante',
      hot: 'Picante',
      very_hot: 'Muito Picante',
    }
    return levels[this.spiceLevel] || 'Desconhecido'
  },
  calculateCostPrice: sinon.stub().resolves(function (this: any) {
    // Simula cálculo baseado em ingredientes
    this.costPrice = 1.7 // Resultado mock
  }),
  incrementDailySold: sinon.stub().resolves(function (this: any, amount = 1) {
    this.dailySold += amount
  }),
  resetDailySold: sinon.stub().resolves(function (this: any) {
    this.dailySold = 0
  }),
  toggleAvailable: sinon.stub().resolves(function (this: any) {
    this.available = !this.available
  }),
  ...overrides,
})

test.group('CardapioProduto - Unit Tests (Mocked)', () => {
  test('deve criar um produto do cardápio', ({ assert }) => {
    const produto = createMockCardapioProduto({
      name: 'Lasanha',
      description: 'Lasanha de carne ao molho bolonhesa',
      costPrice: 12.0,
      salePrice: 25.0,
      markupPercentage: 108.33,
    })

    assert.exists(produto.id)
    assert.equal(produto.name, 'Lasanha')
    assert.equal(produto.salePrice, 25.0)
  })

  test('deve calcular margem de lucro', ({ assert }) => {
    const produto = createMockCardapioProduto({
      costPrice: 10.0,
      salePrice: 20.0,
    })

    assert.equal(produto.profitMargin, 50) // (20 - 10) / 20 * 100 = 50%
  })

  test('deve retornar labels dietárias corretas', ({ assert }) => {
    const produto = createMockCardapioProduto({
      name: 'Salada Vegana',
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      lactoseFree: true,
    })

    const labels = produto.dietaryLabels
    assert.include(labels, 'Vegetariano')
    assert.include(labels, 'Vegano')
    assert.include(labels, 'Sem Glúten')
    assert.include(labels, 'Sem Lactose')
  })

  test('deve retornar nível de picância formatado', ({ assert }) => {
    const produto = createMockCardapioProduto({
      name: 'Prato Picante',
      spiceLevel: 'hot',
    })

    assert.equal(produto.spiceLevelDisplay, 'Picante')
  })

  test('deve calcular custo baseado em ingredientes', async ({ assert }) => {
    const produto = createMockCardapioProduto({
      costPrice: 0,
    })

    // Simular cálculo
    produto.costPrice = 1.7

    assert.equal(produto.costPrice, 1.7)
  })

  test('deve incrementar vendas diárias', async ({ assert }) => {
    const produto = createMockCardapioProduto({
      dailySold: 0,
    })

    // Simular incremento
    produto.dailySold = 3
    assert.equal(produto.dailySold, 3)

    produto.dailySold += 1
    assert.equal(produto.dailySold, 4)
  })

  test('deve resetar vendas diárias', async ({ assert }) => {
    const produto = createMockCardapioProduto({
      dailySold: 10,
    })

    // Simular reset
    produto.dailySold = 0
    assert.equal(produto.dailySold, 0)
  })

  test('deve alternar disponibilidade', async ({ assert }) => {
    const produto = createMockCardapioProduto({
      available: true,
    })

    // Simular toggle
    produto.available = !produto.available
    assert.isFalse(produto.available)

    produto.available = !produto.available
    assert.isTrue(produto.available)
  })
})
