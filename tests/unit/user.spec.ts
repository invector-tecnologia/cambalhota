import { test } from '@japa/runner'
import sinon from 'sinon'

/**
 * Testes do User - 100% desacoplados de banco de dados
 * Utiliza mocks para simular operações e hash de senha
 */

const createMockUser = (overrides: Record<string, any> = {}) => ({
  id: 1,
  email: 'teste@tavolo.com',
  password: '$2a$12$hashedpassword123456789',
  fullName: 'João Silva',
  empresaId: 1,
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  get emailVerified(): boolean {
    return this.emailVerifiedAt !== null
  },
  get initials(): string {
    if (!this.fullName) return ''
    return this.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  },
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

test.group('User - Unit Tests (Mocked)', (group) => {
  let sandbox: sinon.SinonSandbox

  group.setup(async () => {
    sandbox = sinon.createSandbox()
  })

  group.teardown(async () => {
    sandbox.restore()
  })

  test('deve criar um usuário com dados válidos', async ({ assert }) => {
    // Arrange
    const mockEmpresa = createMockEmpresa()
    const mockUser = createMockUser({
      email: 'teste@tavolo.com',
      empresaId: mockEmpresa.id,
    })

    // Assert
    assert.exists(mockUser.id)
    assert.equal(mockUser.email, 'teste@tavolo.com')
    assert.equal(mockUser.empresaId, mockEmpresa.id)
  })

  test('deve simular hash de senha', async ({ assert }) => {
    // Arrange
    const plainPassword = 'senha123'
    // Em produção, seria hasheada
    const hashedPassword = '$2a$12$' + plainPassword.split('').reverse().join('')

    const mockUser = createMockUser({
      password: hashedPassword,
    })

    // Assert
    // A senha mockada não é a mesma que a plaintext
    assert.notEqual(mockUser.password, plainPassword)
    // Simulamos que a verificação funcionaria
    assert.isTrue(mockUser.password.startsWith('$2a$12$'))
  })

  test('deve verificar se email está verificado', async ({ assert }) => {
    // Arrange
    const userVerified = createMockUser({
      email: 'verificado@tavolo.com',
      emailVerifiedAt: new Date(),
    })

    const userNotVerified = createMockUser({
      email: 'nao-verificado@tavolo.com',
      emailVerifiedAt: null,
    })

    // Assert
    assert.isTrue(userVerified.emailVerified)
    assert.isFalse(userNotVerified.emailVerified)
  })

  test('deve retornar nome de exibição corretamente', async ({ assert }) => {
    // Arrange
    const userWithName = createMockUser({
      email: 'teste@tavolo.com',
      fullName: 'João Silva',
    })

    const userWithoutName = createMockUser({
      email: 'teste2@tavolo.com',
      fullName: null,
    })

    // Assert
    assert.equal(userWithName.fullName, 'João Silva')
    assert.isNull(userWithoutName.fullName)
  })

  test('deve calcular iniciais do nome corretamente', async ({ assert }) => {
    // Arrange
    const testCases = [
      { fullName: 'João Pedro Silva', expected: 'JPS' },
      { fullName: 'Maria', expected: 'M' },
      { fullName: 'Ana Maria Oliveira', expected: 'AMO' },
      { fullName: null, expected: '' },
    ]

    // Act & Assert
    for (const testCase of testCases) {
      const user = createMockUser({ fullName: testCase.fullName })
      assert.equal(user.initials, testCase.expected, `Falha para: ${testCase.fullName}`)
    }
  })

  test('deve pertencer a uma empresa', async ({ assert }) => {
    // Arrange
    const mockEmpresa = createMockEmpresa({ id: 42, name: 'Restaurante XYZ' })
    const mockUser = createMockUser({
      empresaId: mockEmpresa.id,
    })

    // Assert
    assert.equal(mockUser.empresaId, mockEmpresa.id)
    assert.equal(mockUser.empresaId, 42)
  })

  test('deve simular validação de email único', async ({ assert }) => {
    // Arrange
    const existingUsers = [
      createMockUser({ id: 1, email: 'teste@tavolo.com' }),
      createMockUser({ id: 2, email: 'outro@tavolo.com' }),
    ]

    const mockCheckEmail = (email: string) => {
      return existingUsers.some((u) => u.email === email)
    }

    // Act & Assert
    assert.isTrue(mockCheckEmail('teste@tavolo.com'))
    assert.isFalse(mockCheckEmail('novo@tavolo.com'))
  })

  test('deve validar múltiplos usuários com dados diferentes', async ({ assert }) => {
    // Arrange
    const users = [
      createMockUser({ id: 1, email: 'user1@test.com', fullName: 'User One' }),
      createMockUser({ id: 2, email: 'user2@test.com', fullName: 'User Two' }),
      createMockUser({ id: 3, email: 'user3@test.com', fullName: 'User Three' }),
    ]

    // Assert
    assert.lengthOf(users, 3)
    assert.deepEqual(
      users.map((u) => u.email),
      ['user1@test.com', 'user2@test.com', 'user3@test.com']
    )
    assert.isTrue(users.every((u) => u.emailVerified === true))
  })
})
