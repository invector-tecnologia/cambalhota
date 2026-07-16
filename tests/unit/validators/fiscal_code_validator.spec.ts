import { test } from '@japa/runner'
import { FiscalCodeValidator } from '#helpers/validators/fiscal_code_validator'

test.group('FiscalCodeValidator - NCM', () => {
  test('deve validar NCM válido sem formatação', ({ assert }) => {
    const ncm = '19059090'
    assert.isTrue(FiscalCodeValidator.validateNCM(ncm))
  })

  test('deve validar NCM válido com formatação', ({ assert }) => {
    const ncm = '1905.90.90'
    assert.isTrue(FiscalCodeValidator.validateNCM(ncm))
  })

  test('deve rejeitar NCM com tamanho incorreto', ({ assert }) => {
    const ncms = ['1234', '123456', '1234567', '123456789']
    for (const ncm of ncms) {
      assert.isFalse(FiscalCodeValidator.validateNCM(ncm))
    }
  })

  test('deve rejeitar NCM com capítulo inválido (00)', ({ assert }) => {
    const ncm = '00059090'
    assert.isFalse(FiscalCodeValidator.validateNCM(ncm))
  })

  test('deve rejeitar NCM com capítulo acima de 97', ({ assert }) => {
    const ncm = '98059090'
    assert.isFalse(FiscalCodeValidator.validateNCM(ncm))
  })

  test('deve formatar NCM corretamente', ({ assert }) => {
    const ncm = '19059090'
    const formatted = FiscalCodeValidator.formatNCM(ncm)
    assert.equal(formatted, '1905.90.90')
  })

  test('NCMs comuns para restaurantes devem ser válidos', ({ assert }) => {
    const ncms = FiscalCodeValidator.getCommonNCMs()
    for (const item of ncms) {
      assert.isTrue(
        FiscalCodeValidator.validateNCM(item.code),
        `NCM ${item.code} (${item.description}) deveria ser válido`
      )
    }
  })
})

test.group('FiscalCodeValidator - CFOP', () => {
  test('deve validar CFOP válido sem formatação', ({ assert }) => {
    const cfop = '5102'
    assert.isTrue(FiscalCodeValidator.validateCFOP(cfop))
  })

  test('deve validar CFOP válido com formatação', ({ assert }) => {
    const cfop = '5.102'
    assert.isTrue(FiscalCodeValidator.validateCFOP(cfop))
  })

  test('deve rejeitar CFOP com tamanho incorreto', ({ assert }) => {
    const cfops = ['123', '12345']
    for (const cfop of cfops) {
      assert.isFalse(FiscalCodeValidator.validateCFOP(cfop))
    }
  })

  test('deve rejeitar CFOP com primeiro dígito inválido', ({ assert }) => {
    const cfops = ['0102', '4102', '8102', '9102']
    for (const cfop of cfops) {
      assert.isFalse(FiscalCodeValidator.validateCFOP(cfop))
    }
  })

  test('deve validar CFOPs com primeiro dígito válido', ({ assert }) => {
    const firstDigits = ['1', '2', '3', '5', '6', '7']
    for (const digit of firstDigits) {
      const cfop = `${digit}102`
      assert.isTrue(FiscalCodeValidator.validateCFOP(cfop), `CFOP ${cfop} deveria ser válido`)
    }
  })

  test('deve formatar CFOP corretamente', ({ assert }) => {
    const cfop = '5102'
    const formatted = FiscalCodeValidator.formatCFOP(cfop)
    assert.equal(formatted, '5.102')
  })

  test('CFOPs comuns para restaurantes devem ser válidos', ({ assert }) => {
    const cfops = FiscalCodeValidator.getCommonCFOPs()
    for (const item of cfops) {
      assert.isTrue(
        FiscalCodeValidator.validateCFOP(item.code),
        `CFOP ${item.code} (${item.description}) deveria ser válido`
      )
    }
  })

  test('deve sugerir CFOP correto para venda dentro do estado', ({ assert }) => {
    const cfop = FiscalCodeValidator.suggestCFOP('servico', true)
    assert.equal(cfop, '5405') // Serviço dentro do estado
  })

  test('deve sugerir CFOP correto para venda fora do estado', ({ assert }) => {
    const cfop = FiscalCodeValidator.suggestCFOP('servico', false)
    assert.equal(cfop, '6405') // Serviço fora do estado
  })
})

test.group('FiscalCodeValidator - CST', () => {
  test('deve validar CST válido', ({ assert }) => {
    const validCSTs = ['00', '10', '20', '30', '40', '41', '50', '51', '60', '70', '90']
    for (const cst of validCSTs) {
      assert.isTrue(FiscalCodeValidator.validateCST(cst))
    }
  })

  test('deve rejeitar CST inválido', ({ assert }) => {
    const invalidCSTs = ['99', '15', '05', '80']
    for (const cst of invalidCSTs) {
      assert.isFalse(FiscalCodeValidator.validateCST(cst))
    }
  })

  test('deve rejeitar CST com tamanho incorreto', ({ assert }) => {
    const csts = ['0', '000', '1']
    for (const cst of csts) {
      assert.isFalse(FiscalCodeValidator.validateCST(cst))
    }
  })
})

test.group('FiscalCodeValidator - CSOSN', () => {
  test('deve validar CSOSN válido', ({ assert }) => {
    const validCSOSNs = ['101', '102', '103', '201', '202', '203', '300', '400', '500', '900']
    for (const csosn of validCSOSNs) {
      assert.isTrue(FiscalCodeValidator.validateCSOSN(csosn))
    }
  })

  test('deve rejeitar CSOSN inválido', ({ assert }) => {
    const invalidCSOSNs = ['100', '999', '001', '200']
    for (const csosn of invalidCSOSNs) {
      assert.isFalse(FiscalCodeValidator.validateCSOSN(csosn))
    }
  })

  test('deve rejeitar CSOSN com tamanho incorreto', ({ assert }) => {
    const csosns = ['10', '1000', '1']
    for (const csosn of csosns) {
      assert.isFalse(FiscalCodeValidator.validateCSOSN(csosn))
    }
  })

  test('CSOSNs comuns para Simples Nacional devem ser válidos', ({ assert }) => {
    const csosns = FiscalCodeValidator.getCommonCSOSNs()
    for (const item of csosns) {
      assert.isTrue(
        FiscalCodeValidator.validateCSOSN(item.code),
        `CSOSN ${item.code} (${item.description}) deveria ser válido`
      )
    }
  })
})

test.group('FiscalCodeValidator - CEST', () => {
  test('deve validar CEST válido sem formatação', ({ assert }) => {
    const cest = '0100100'
    assert.isTrue(FiscalCodeValidator.validateCEST(cest))
  })

  test('deve validar CEST válido com formatação', ({ assert }) => {
    const cest = '01.001.00'
    assert.isTrue(FiscalCodeValidator.validateCEST(cest))
  })

  test('deve aceitar CEST vazio (opcional)', ({ assert }) => {
    assert.isTrue(FiscalCodeValidator.validateCEST(''))
  })

  test('deve rejeitar CEST com tamanho incorreto', ({ assert }) => {
    const cests = ['123', '123456', '12345678']
    for (const cest of cests) {
      assert.isFalse(FiscalCodeValidator.validateCEST(cest))
    }
  })

  test('deve formatar CEST corretamente', ({ assert }) => {
    const cest = '0100100'
    const formatted = FiscalCodeValidator.formatCEST(cest)
    assert.equal(formatted, '01.001.00')
  })
})
