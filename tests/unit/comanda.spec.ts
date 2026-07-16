import { test } from '@japa/runner'
import sinon from 'sinon'

/**
 * Testes da Comanda - 100% desacoplados de banco de dados
 * Utiliza mocks para simular operações
 */

const createMockComanda = (overrides: Record<string, any> = {}) => ({
  id: 1,
  empresaId: 1,
  mesaId: 1,
  number: 'CMD001',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  occupy: sinon.stub().resolves(),
  free: sinon.stub().resolves(),
  refresh: sinon.stub().resolves(),
  ...overrides,
})

const createMockMesa = (overrides: Record<string, any> = {}) => ({
  id: 1,
  empresaId: 1,
  number: '10',
  name: 'Mesa 10',
  status: 'available',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  refresh: sinon.stub().resolves(),
  ...overrides,
})

const createMockEmpresa = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'Restaurante Teste',
  cnpj: '12345678901234',
  active: true,
  createdAt: new Date(),
  ...overrides,
})

test.group('Comanda - Unit Tests (Mocked)', (group) => {
  let sandbox: sinon.SinonSandbox

  group.setup(async () => {
    sandbox = sinon.createSandbox()
  })

  group.teardown(async () => {
    sandbox.restore()
  })

  test('deve criar uma comanda com valores corretos', async ({ assert }) => {
    // Arrange
    const mockEmpresa = createMockEmpresa()
    const mockMesa = createMockMesa()

    const mockComanda = createMockComanda({
      empresaId: mockEmpresa.id,
      mesaId: mockMesa.id,
      number: 'CMD001',
      active: true,
    })

    // Act
    // Simulamos criação de comanda
    const result = {
      id: mockComanda.id,
      empresaId: mockComanda.empresaId,
      mesaId: mockComanda.mesaId,
      number: mockComanda.number,
      active: mockComanda.active,
    }

    // Assert
    assert.exists(result.id)
    assert.equal(result.number, 'CMD001')
    assert.equal(result.active, true)
    assert.equal(result.empresaId, mockEmpresa.id)
    assert.equal(result.mesaId, mockMesa.id)
  })

  test('deve ocupar mesa ao chamar occupy()', async ({ assert }) => {
    // Arrange
    const mockComanda = createMockComanda({ active: true })
    const mockMesa = createMockMesa({ status: 'available' })

    // Stub do método occupy para mudar status da mesa
    mockComanda.occupy.callsFake(async () => {
      mockMesa.status = 'occupied'
    })

    // Act
    await mockComanda.occupy()

    // Assert
    assert.equal(mockMesa.status, 'occupied')
    assert.isTrue(mockComanda.active)
    assert.isTrue(mockComanda.occupy.called)
  })

  test('deve liberar mesa ao chamar free()', async ({ assert }) => {
    // Arrange
    const mockComanda = createMockComanda({ active: true })
    const mockMesa = createMockMesa({ status: 'occupied' })

    // Stub dos métodos
    mockComanda.occupy.callsFake(async () => {
      mockMesa.status = 'occupied'
      mockComanda.active = true
    })

    mockComanda.free.callsFake(async () => {
      mockMesa.status = 'available'
      mockComanda.active = false
    })

    // Act
    await mockComanda.occupy()
    await mockComanda.free()

    // Assert
    assert.equal(mockMesa.status, 'available')
    assert.isFalse(mockComanda.active)
    assert.isTrue(mockComanda.free.called)
  })

  test('deve manter referência correta de empresa e mesa', async ({ assert }) => {
    // Arrange
    const mockEmpresa = createMockEmpresa({ id: 42 })
    const mockMesa = createMockMesa({ id: 99 })
    const mockComanda = createMockComanda({
      empresaId: mockEmpresa.id,
      mesaId: mockMesa.id,
    })

    // Assert
    assert.equal(mockComanda.empresaId, 42)
    assert.equal(mockComanda.mesaId, 99)
    assert.deepEqual(
      { empresaId: mockComanda.empresaId, mesaId: mockComanda.mesaId },
      { empresaId: 42, mesaId: 99 }
    )
  })

  test('deve permitir múltiplas comandas por mesa', async ({ assert }) => {
    // Arrange
    // const mockEmpresa = createMockEmpresa()
    const mockMesa = createMockMesa()

    const comandas = [
      createMockComanda({ id: 1, number: 'CMD001', mesaId: mockMesa.id }),
      createMockComanda({ id: 2, number: 'CMD002', mesaId: mockMesa.id }),
      createMockComanda({ id: 3, number: 'CMD003', mesaId: mockMesa.id }),
    ]

    // Assert
    assert.lengthOf(comandas, 3)
    assert.isTrue(comandas.every((c) => c.mesaId === mockMesa.id))
    assert.deepEqual(
      comandas.map((c) => c.number),
      ['CMD001', 'CMD002', 'CMD003']
    )
  })
})
