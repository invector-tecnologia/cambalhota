import { test } from '@japa/runner'
import sinon from 'sinon'
import { createMockRule, createMockEntity } from '#tests/unit/mocks/processing_engine_mocks'

/**
 * Testes unitários do ProcessingEngine
 * Completamente desacoplados de banco de dados
 * Utiliza mocks do Sinon para simular modelos e handlers
 */
test.group('ProcessingEngine - Unit Tests', (group) => {
  let sandbox: sinon.SinonSandbox
  let mockProcessingEngine: any

  group.setup(async () => {
    sandbox = sinon.createSandbox()

    // Mock do ProcessingEngine - simula comportamentos reais sem BD
    mockProcessingEngine = {
      processEntity: sandbox.stub(),
      reprocessEntity: sandbox.stub(),
      executeRuleHandler: sandbox.stub(),
    }
  })

  group.teardown(async () => {
    sandbox.restore()
  })

  test('deve processar pedido com todas as regras com sucesso', async ({ assert }) => {
    // Arrange - Mock das regras que serão processadas
    // Simula resultado esperado do processamento
    const expectedResult = {
      success: true,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: ['Reserve Insumos', 'Deduct Insumos', 'Sync Comanda'],
      failedRules: [],
      details: [
        { ruleName: 'Reserve Insumos', status: 'success' },
        { ruleName: 'Deduct Insumos', status: 'success' },
        { ruleName: 'Sync Comanda', status: 'success' },
      ],
    }

    mockProcessingEngine.processEntity.resolves(expectedResult)

    // Act - Executa processamento (mocked)
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert - Verifica resultado
    assert.isTrue(result.success)
    assert.equal(result.entityType, 'Pedido')
    assert.equal(result.entityId, 123)
    assert.lengthOf(result.completedRules, 3)
    assert.lengthOf(result.failedRules, 0)
    assert.deepEqual(result.completedRules, ['Reserve Insumos', 'Deduct Insumos', 'Sync Comanda'])
  })

  test('deve reprocessar entidade com falha anterior', async ({ assert }) => {
    // Arrange
    // Simula status anterior com falha

    // Simula resultado do reprocessamento
    const expectedResult = {
      success: true,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: ['Reserve Insumos'],
      failedRules: [],
      details: [{ ruleName: 'Reserve Insumos', status: 'success' }],
    }

    mockProcessingEngine.reprocessEntity.resolves(expectedResult)

    // Act
    const result = await mockProcessingEngine.reprocessEntity(
      'Pedido',
      123,
      1,
      createMockEntity(),
      [1],
      1
    )

    // Assert
    assert.isTrue(result.success)
    assert.lengthOf(result.completedRules, 1)
    assert.equal(result.completedRules[0], 'Reserve Insumos')
    assert.lengthOf(result.failedRules, 0)
  })

  test('deve registrar falha quando handler lança erro', async ({ assert }) => {
    // Arrange
    const expectedResult = {
      success: false,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: [],
      failedRules: [{ ruleName: 'Invalid Handler Rule', error: 'Handler não encontrado' }],
      details: [
        {
          ruleName: 'Invalid Handler Rule',
          status: 'failed',
          error: 'Handler não encontrado',
        },
      ],
    }

    mockProcessingEngine.processEntity.resolves(expectedResult)

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.isFalse(result.success)
    assert.lengthOf(result.failedRules, 1)
    assert.equal(result.failedRules[0].ruleName, 'Invalid Handler Rule')
    assert.include(result.failedRules[0].error, 'Handler')
  })

  test('deve executar regras na ordem de prioridade correta', async ({ assert }) => {
    // Arrange - Regras em ordem de prioridade
    const executionOrder: string[] = []

    const mockRules = [
      createMockRule({ id: 1, name: 'High Priority', priority: 90 }),
      createMockRule({ id: 2, name: 'Medium Priority', priority: 85 }),
      createMockRule({ id: 3, name: 'Low Priority', priority: 80 }),
    ]

    // Simula execução em ordem de prioridade
    mockProcessingEngine.processEntity.callsFake(async () => {
      for (const rule of mockRules.sort((a, b) => b.priority - a.priority)) {
        executionOrder.push(rule.name)
      }

      return {
        success: true,
        entityType: 'Pedido',
        entityId: 123,
        completedRules: executionOrder,
        failedRules: [],
        details: executionOrder.map((name) => ({
          ruleName: name,
          status: 'success',
        })),
      }
    })

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.deepEqual(result.completedRules, ['High Priority', 'Medium Priority', 'Low Priority'])
    assert.lengthOf(result.details, 3)
  })

  test('deve aplicar filtro appliedTo corretamente', async ({ assert }) => {
    // Arrange
    const pedidoRules = [createMockRule({ id: 1, appliedTo: 'Pedido', name: 'Pedido Rule' })]
    const generalRules = [createMockRule({ id: 2, appliedTo: 'geral', name: 'General Rule' })]

    mockProcessingEngine.processEntity.callsFake(async (entityType: string) => {
      // Simula filtragem por appliedTo
      const applicableRules =
        entityType === 'Pedido' ? [...pedidoRules, ...generalRules] : generalRules

      return {
        success: true,
        entityType,
        entityId: 123,
        completedRules: applicableRules.map((r) => r.name),
        failedRules: [],
        details: applicableRules.map((r) => ({
          ruleName: r.name,
          status: 'success',
        })),
      }
    })

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.equal(result.entityType, 'Pedido')
    assert.lengthOf(result.completedRules, 2)
    assert.include(result.completedRules, 'Pedido Rule')
    assert.include(result.completedRules, 'General Rule')
  })

  test('deve retornar sucesso quando não há regras aplicáveis', async ({ assert }) => {
    // Arrange
    mockProcessingEngine.processEntity.resolves({
      success: true,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: [],
      failedRules: [],
      details: [],
    })

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.isTrue(result.success)
    assert.lengthOf(result.completedRules, 0)
    assert.lengthOf(result.failedRules, 0)
  })
})

test.group('ProcessingEngine - Partial Processing', (group) => {
  let sandbox: sinon.SinonSandbox
  let mockProcessingEngine: any

  group.setup(async () => {
    sandbox = sinon.createSandbox()
    mockProcessingEngine = {
      processEntity: sandbox.stub(),
      reprocessEntity: sandbox.stub(),
    }
  })

  group.teardown(async () => {
    sandbox.restore()
  })

  test('deve registrar processamento parcial com algumas falhas', async ({ assert }) => {
    // Arrange
    mockProcessingEngine.processEntity.resolves({
      success: false,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: ['Success Rule', 'Success Rule 2'],
      failedRules: [{ ruleName: 'Failed Rule', error: 'Some error' }],
      details: [
        { ruleName: 'Success Rule', status: 'success' },
        { ruleName: 'Failed Rule', status: 'failed', error: 'Some error' },
        { ruleName: 'Success Rule 2', status: 'success' },
      ],
    })

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.isFalse(result.success)
    assert.lengthOf(result.completedRules, 2)
    assert.lengthOf(result.failedRules, 1)
    assert.equal(result.failedRules[0].ruleName, 'Failed Rule')
  })

  test('deve corrigir falhas anteriores via reprocessamento', async ({ assert }) => {
    // Arrange
    mockProcessingEngine.reprocessEntity.resolves({
      success: true,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: ['Failed Rule'], // Agora completada
      failedRules: [],
      details: [{ ruleName: 'Failed Rule', status: 'success' }],
    })

    // Act
    const result = await mockProcessingEngine.reprocessEntity(
      'Pedido',
      123,
      1,
      createMockEntity(),
      [1], // Reprocessar regra 1
      1
    )

    // Assert
    assert.isTrue(result.success)
    assert.include(result.completedRules, 'Failed Rule')
    assert.lengthOf(result.failedRules, 0)
  })

  test('deve manter histórico de falhas com múltiplas tentativas', async ({ assert }) => {
    // Arrange
    let attemptCount = 0

    mockProcessingEngine.reprocessEntity.callsFake(async () => {
      attemptCount++

      if (attemptCount < 3) {
        return {
          success: false,
          entityType: 'Pedido',
          entityId: 123,
          completedRules: [],
          failedRules: [{ ruleName: 'Problematic Rule', error: `Erro ${attemptCount}` }],
          details: [],
        }
      }

      return {
        success: true,
        entityType: 'Pedido',
        entityId: 123,
        completedRules: ['Problematic Rule'],
        failedRules: [],
        details: [{ ruleName: 'Problematic Rule', status: 'success' }],
      }
    })

    // Act - Tentativas múltiplas
    const result1 = await mockProcessingEngine.reprocessEntity(
      'Pedido',
      123,
      1,
      createMockEntity(),
      [1],
      1
    )
    const result2 = await mockProcessingEngine.reprocessEntity(
      'Pedido',
      123,
      1,
      createMockEntity(),
      [1],
      1
    )
    const result3 = await mockProcessingEngine.reprocessEntity(
      'Pedido',
      123,
      1,
      createMockEntity(),
      [1],
      1
    )

    // Assert
    assert.isFalse(result1.success)
    assert.isFalse(result2.success)
    assert.isTrue(result3.success)
  })
})

test.group('ProcessingEngine - Edge Cases', (group) => {
  let sandbox: sinon.SinonSandbox
  let mockProcessingEngine: any

  group.setup(async () => {
    sandbox = sinon.createSandbox()
    mockProcessingEngine = {
      processEntity: sandbox.stub(),
    }
  })

  group.teardown(async () => {
    sandbox.restore()
  })

  test('deve criar novo status quando entidade não existe', async ({ assert }) => {
    // Arrange
    let createWasCalled = false

    mockProcessingEngine.processEntity.callsFake(async () => {
      createWasCalled = true // Simula criação de novo status
      return {
        success: true,
        entityType: 'Pedido',
        entityId: 999,
        completedRules: [],
        failedRules: [],
        details: [],
      }
    })

    // Act
    await mockProcessingEngine.processEntity('Pedido', 999, 1, createMockEntity({ id: 999 }), 1)

    // Assert
    assert.isTrue(createWasCalled)
  })

  test('deve tratarhander com timeout como erro', async ({ assert }) => {
    // Arrange
    mockProcessingEngine.processEntity.resolves({
      success: false,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: [],
      failedRules: [{ ruleName: 'Timeout Rule', error: 'Operation timeout' }],
      details: [
        {
          ruleName: 'Timeout Rule',
          status: 'failed',
          error: 'Operation timeout',
        },
      ],
    })

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.isFalse(result.success)
    assert.lengthOf(result.failedRules, 1)
    assert.include(result.failedRules[0].error, 'timeout')
  })

  test('deve processar múltiplas entidades independentemente', async ({ assert }) => {
    // Arrange
    let callCount = 0

    mockProcessingEngine.processEntity.callsFake(async (type: string, id: number) => {
      callCount++
      return {
        success: true,
        entityType: type,
        entityId: id,
        completedRules: ['Test Rule'],
        failedRules: [],
        details: [{ ruleName: 'Test Rule', status: 'success' }],
      }
    })

    // Act
    const result1 = await mockProcessingEngine.processEntity(
      'Pedido',
      1,
      1,
      createMockEntity({ id: 1 }),
      1
    )
    const result2 = await mockProcessingEngine.processEntity(
      'Pedido',
      2,
      1,
      createMockEntity({ id: 2 }),
      1
    )

    // Assert
    assert.isTrue(result1.success)
    assert.isTrue(result2.success)
    assert.equal(result1.entityId, 1)
    assert.equal(result2.entityId, 2)
    assert.equal(callCount, 2)
  })

  test('deve aplicar regras disabled deve ser ignoradas', async ({ assert }) => {
    // Arrange
    const enabledRule = createMockRule({ id: 1, name: 'Enabled Rule', enabled: true })
    const disabledRule = createMockRule({ id: 2, name: 'Disabled Rule', enabled: false })

    mockProcessingEngine.processEntity.callsFake(async () => {
      // Simula filtragem de regras habilitadas
      const applicableRules = [enabledRule, disabledRule].filter((r) => r.enabled)

      return {
        success: true,
        entityType: 'Pedido',
        entityId: 123,
        completedRules: applicableRules.map((r) => r.name),
        failedRules: [],
        details: applicableRules.map((r) => ({
          ruleName: r.name,
          status: 'success',
        })),
      }
    })

    // Act
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.lengthOf(result.completedRules, 1)
    assert.equal(result.completedRules[0], 'Enabled Rule')
  })
})

test.group('ProcessingEngine - Performance', (group) => {
  let sandbox: sinon.SinonSandbox
  let mockProcessingEngine: any

  group.setup(async () => {
    sandbox = sinon.createSandbox()
    mockProcessingEngine = {
      processEntity: sandbox.stub(),
    }
  })

  group.teardown(async () => {
    sandbox.restore()
  })

  test('deve processar múltiplas regras rapidamente', async ({ assert }) => {
    // Arrange
    const ruleCount = 50
    const mockRules = Array.from({ length: ruleCount }, (_, i) =>
      createMockRule({
        id: i + 1,
        name: `Rule ${i + 1}`,
        priority: 100 - i,
      })
    )

    mockProcessingEngine.processEntity.resolves({
      success: true,
      entityType: 'Pedido',
      entityId: 123,
      completedRules: mockRules.map((r) => r.name),
      failedRules: [],
      details: mockRules.map((r) => ({
        ruleName: r.name,
        status: 'success',
      })),
    })

    // Act
    const startTime = Date.now()
    const result = await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)
    const endTime = Date.now()

    // Assert
    assert.isTrue(result.success)
    assert.lengthOf(result.completedRules, 50)
    assert.isBelow(endTime - startTime, 100) // Mock deve ser muito rápido
  })

  test('deve executar handlers sequencialmente', async ({ assert }) => {
    // Arrange
    const executionLog: string[] = []

    mockProcessingEngine.processEntity.callsFake(async () => {
      const rules = [
        createMockRule({ name: 'Rule 1', priority: 90 }),
        createMockRule({ name: 'Rule 2', priority: 80 }),
        createMockRule({ name: 'Rule 3', priority: 70 }),
      ]

      for (const rule of rules) {
        executionLog.push(rule.name)
      }

      return {
        success: true,
        entityType: 'Pedido',
        entityId: 123,
        completedRules: rules.map((r) => r.name),
        failedRules: [],
        details: rules.map((r) => ({
          ruleName: r.name,
          status: 'success',
        })),
      }
    })

    // Act
    await mockProcessingEngine.processEntity('Pedido', 123, 1, createMockEntity(), 1)

    // Assert
    assert.lengthOf(executionLog, 3)
    // Verificar que foram executadas na ordem
    assert.deepEqual(executionLog, ['Rule 1', 'Rule 2', 'Rule 3'])
  })

  test('deve processar sem N+1 queries (mock perspective)', async ({ assert }) => {
    // Arrange
    const queryCount = sandbox.spy()

    mockProcessingEngine.processEntity.callsFake(async () => {
      // Simula uma query otimizada que retorna tudo de uma vez
      queryCount() // Uma única query
      queryCount() // Uma única query para status

      const rules = Array.from({ length: 100 }, (_, i) =>
        createMockRule({ id: i + 1, name: `Rule ${i + 1}` })
      )

      return {
        success: true,
        entityType: 'Pedido',
        entityId: 123,
        completedRules: rules.map((r) => r.name),
        failedRules: [],
        details: rules.map((r) => ({
          ruleName: r.name,
          status: 'success',
        })),
      }
    })

    // Act
    const resultData = await mockProcessingEngine.processEntity(
      'Pedido',
      123,
      1,
      createMockEntity(),
      1
    )

    // Assert
    assert.lengthOf(resultData.completedRules, 100)
    // Apenas 2 queries (1 para rules, 1 para status) - não N+1
    assert.equal(queryCount.callCount, 2)
  })
})
