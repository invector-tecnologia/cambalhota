import { test } from '@japa/runner'
import { buildBatchKey } from '#services/r2_logger'

test.group('R2Logger batch key', () => {
  test('usa operationId quando presente em logs FISCAL', ({ assert }) => {
    const key = buildBatchKey('critical', '31968879000193', 'vendaId:254', 'FISCAL_EMIT_START')

    assert.equal(key, 'critical:31968879000193:vendaId:254')
  })

  test('faz fallback para tipo FISCAL quando operationId ausente', ({ assert }) => {
    const key = buildBatchKey('critical', '31968879000193', null, 'FISCAL_EMIT_FAILED')

    assert.equal(key, 'critical:31968879000193:FISCAL')
  })

  test('usa no-cnpj quando CNPJ ausente', ({ assert }) => {
    const key = buildBatchKey('critical', null, 'fiscalNoteId:abc', 'FISCAL_AUTHORIZED')

    assert.equal(key, 'critical:no-cnpj:fiscalNoteId:abc')
  })
})
