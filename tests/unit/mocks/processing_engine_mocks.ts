import sinon from 'sinon'

/**
 * Mocks completamente desacoplados do banco de dados
 * Simula modelos Lucid sem dependências reais
 */

export const createMockRule = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'Test Rule',
  handler: 'TestService.testMethod',
  priority: 90,
  enabled: true,
  appliedTo: 'Pedido',
  empresaId: 1,
  getHandler: () => ({
    serviceName: 'TestService',
    methodName: 'testMethod',
  }),
  ...overrides,
})

export const createMockEvent = (overrides: Record<string, any> = {}) => ({
  id: 1,
  processingRuleId: 1,
  entityType: 'Pedido',
  entityId: 123,
  empresaId: 1,
  ruleName: 'Test Rule',
  status: 'success',
  error: null,
  stackTrace: null,
  data: null,
  executedBy: 1,
  createdAt: new Date(),
  markAsProcessing: sinon.stub().resolves(),
  markAsSuccess: sinon.stub().resolves(),
  markAsFailed: sinon.stub().resolves(),
  markAsReprocessing: sinon.stub().resolves(),
  ...overrides,
})

export const createMockStatus = (overrides: Record<string, any> = {}) => ({
  id: 1,
  entityType: 'Pedido',
  entityId: 123,
  empresaId: 1,
  status: 'complete',
  completedRules: ['Rule 1', 'Rule 2', 'Rule 3'],
  failedRules: [] as Array<{ ruleName: string; error: string }>,
  createdAt: new Date(),
  updatedAt: new Date(),
  markAsComplete: sinon.stub().resolves(),
  markAsPartial: sinon.stub().resolves(),
  markAsFailed: sinon.stub().resolves(),
  ...overrides,
})

export const createMockEntity = (overrides: Record<string, any> = {}) => ({
  id: 123,
  empresaId: 1,
  createdAt: new Date(),
  ...overrides,
})

/**
 * Cria stubs para ProcessingRule.query()
 * Simula uma query fluente sem acessar o banco
 */
export const createMockRuleQuery = (rules: any[] = []) => {
  const queryBuilder = {
    where: sinon.stub().returnsThis(),
    whereIn: sinon.stub().returnsThis(),
    orderBy: sinon.stub().returnsThis(),
    first: sinon.stub(),
    then: sinon.stub(),
  }

  // Simula execução da query
  ;(queryBuilder as any)[Symbol.asyncIterator] = async function* () {
    for (const rule of rules) {
      yield rule
    }
  }

  // Se for um find único, retorna o primeiro
  queryBuilder.first.resolves(rules.length > 0 ? rules[0] : null)

  // Retorna array quando iterado
  Object.assign(queryBuilder, rules)

  return queryBuilder
}

/**
 * Cria stubs para EntityProcessingStatus.query()
 */
export const createMockStatusQuery = (status: any | null = null) => {
  return {
    where: sinon.stub().returnsThis(),
    first: sinon.stub().resolves(status),
    then: sinon.stub(),
  }
}

/**
 * Cria um mock completo para ProcessingRule model
 */
export const createMockProcessingRuleModel = () => {
  return {
    query: sinon.stub(),
    create: sinon.stub(),
    updateOrCreate: sinon.stub(),
    findOrFail: sinon.stub(),
    find: sinon.stub(),
  }
}

/**
 * Cria um mock completo para EntityProcessingStatus model
 */
export const createMockEntityStatusModel = () => {
  return {
    query: sinon.stub(),
    create: sinon.stub(),
    findOrFail: sinon.stub(),
    find: sinon.stub(),
  }
}

/**
 * Cria um mock completo para ProcessingEvent model
 */
export const createMockProcessingEventModel = () => {
  return {
    create: sinon.stub(),
    findOrFail: sinon.stub(),
    find: sinon.stub(),
  }
}
