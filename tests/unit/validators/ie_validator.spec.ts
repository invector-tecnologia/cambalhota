import { test } from '@japa/runner'
import { IEValidator } from '#helpers/validators/ie_validator'

test.group('IEValidator - Geral', () => {
  test('deve aceitar ISENTO para qualquer UF', ({ assert }) => {
    const ufs = ['SP', 'RJ', 'MG', 'RS', 'BA']
    for (const uf of ufs) {
      assert.isTrue(IEValidator.validate('ISENTO', uf))
    }
  })

  test('deve rejeitar IE vazia', ({ assert }) => {
    assert.isFalse(IEValidator.validate('', 'SP'))
  })

  test('deve rejeitar UF vazia', ({ assert }) => {
    assert.isFalse(IEValidator.validate('123456789', ''))
  })
})

test.group('IEValidator - São Paulo (SP)', () => {
  test('deve validar IE válida de SP', ({ assert }) => {
    const ie = '110042490114' // IE válida de SP
    assert.isTrue(IEValidator.validate(ie, 'SP'))
  })

  test('deve rejeitar IE de SP com dígito incorreto', ({ assert }) => {
    const ie = '110042490115' // último dígito errado
    assert.isFalse(IEValidator.validate(ie, 'SP'))
  })

  test('deve rejeitar IE de SP com tamanho incorreto', ({ assert }) => {
    const ie = '11004249011' // 11 dígitos (deveria ser 12)
    assert.isFalse(IEValidator.validate(ie, 'SP'))
  })
})

test.group('IEValidator - Rio de Janeiro (RJ)', () => {
  test('deve validar IE válida de RJ', ({ assert }) => {
    const ie = '12345674' // IE válida de RJ (8 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'RJ'))
  })

  test('deve rejeitar IE de RJ com tamanho incorreto', ({ assert }) => {
    const ie = '1234567' // 7 dígitos (deveria ser 8)
    assert.isFalse(IEValidator.validate(ie, 'RJ'))
  })
})

test.group('IEValidator - Minas Gerais (MG)', () => {
  test('deve validar IE válida de MG', ({ assert }) => {
    const ie = '0623079040081' // IE válida de MG (13 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'MG'))
  })

  test('deve rejeitar IE de MG com tamanho incorreto', ({ assert }) => {
    const ie = '062307904008' // 12 dígitos (deveria ser 13)
    assert.isFalse(IEValidator.validate(ie, 'MG'))
  })
})

test.group('IEValidator - Rio Grande do Sul (RS)', () => {
  test('deve validar IE válida de RS', ({ assert }) => {
    const ie = '0291234569' // IE válida de RS (10 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'RS'))
  })

  test('deve rejeitar IE de RS com tamanho incorreto', ({ assert }) => {
    const ie = '029123456' // 9 dígitos (deveria ser 10)
    assert.isFalse(IEValidator.validate(ie, 'RS'))
  })
})

test.group('IEValidator - Paraná (PR)', () => {
  test('deve validar IE válida de PR', ({ assert }) => {
    const ie = '1234567850' // IE válida de PR (10 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'PR'))
  })

  test('deve rejeitar IE de PR com tamanho incorreto', ({ assert }) => {
    const ie = '123456784' // 9 dígitos (deveria ser 10)
    assert.isFalse(IEValidator.validate(ie, 'PR'))
  })
})

test.group('IEValidator - Santa Catarina (SC)', () => {
  test('deve validar IE válida de SC', ({ assert }) => {
    const ie = '251040852' // IE válida de SC (9 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'SC'))
  })

  test('deve rejeitar IE de SC com tamanho incorreto', ({ assert }) => {
    const ie = '25104085' // 8 dígitos (deveria ser 9)
    assert.isFalse(IEValidator.validate(ie, 'SC'))
  })
})

test.group('IEValidator - Bahia (BA)', () => {
  test('deve validar IE válida de BA com 8 dígitos', ({ assert }) => {
    const ie = '10000041' // IE válida de BA (8 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'BA'))
  })

  test('deve validar IE válida de BA com 9 dígitos', ({ assert }) => {
    const ie = '100000038' // IE válida de BA (9 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'BA'))
  })
})

test.group('IEValidator - Goiás (GO)', () => {
  test('deve validar IE válida de GO', ({ assert }) => {
    const ie = '109876547' // IE válida de GO (9 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'GO'))
  })

  test('deve rejeitar IE de GO com tamanho incorreto', ({ assert }) => {
    const ie = '10987654' // 8 dígitos (deveria ser 9)
    assert.isFalse(IEValidator.validate(ie, 'GO'))
  })
})

test.group('IEValidator - Ceará (CE)', () => {
  test('deve validar IE válida de CE', ({ assert }) => {
    const ie = '123456789' // IE válida de CE (9 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'CE'))
  })

  test('deve rejeitar IE de CE com tamanho incorreto', ({ assert }) => {
    const ie = '12345678' // 8 dígitos (deveria ser 9)
    assert.isFalse(IEValidator.validate(ie, 'CE'))
  })
})

test.group('IEValidator - Pernambuco (PE)', () => {
  test('deve validar IE válida de PE', ({ assert }) => {
    const ie = '123456797' // IE válida de PE (9 dígitos)
    assert.isTrue(IEValidator.validate(ie, 'PE'))
  })

  test('deve rejeitar IE de PE com tamanho incorreto', ({ assert }) => {
    const ie = '12345678' // 8 dígitos (deveria ser 9)
    assert.isFalse(IEValidator.validate(ie, 'PE'))
  })
})

test.group('IEValidator - Acre (AC)', () => {
  test('deve validar IE válida de AC', ({ assert }) => {
    const ie = '0100123456769' // IE válida de AC (13 dígitos, começa com 01)
    assert.isTrue(IEValidator.validate(ie, 'AC'))
  })

  test('deve rejeitar IE de AC que não começa com 01', ({ assert }) => {
    const ie = '0200123456789'
    assert.isFalse(IEValidator.validate(ie, 'AC'))
  })

  test('deve rejeitar IE de AC com tamanho incorreto', ({ assert }) => {
    const ie = '010012345678' // 12 dígitos (deveria ser 13)
    assert.isFalse(IEValidator.validate(ie, 'AC'))
  })
})

test.group('IEValidator - UFs não implementadas', () => {
  test('deve aceitar IE genérica para UFs sem validação específica', ({ assert }) => {
    const ufsNaoImplementadas = [
      'AL',
      'AM',
      'AP',
      'DF',
      'ES',
      'MA',
      'MS',
      'MT',
      'PA',
      'PB',
      'PI',
      'RN',
      'RO',
      'RR',
      'SE',
      'TO',
    ]

    for (const uf of ufsNaoImplementadas) {
      const ie = '12345678' // 8 dígitos
      assert.isTrue(IEValidator.validate(ie, uf), `IE genérica deveria ser aceita para ${uf}`)
    }
  })

  test('deve rejeitar IE muito curta mesmo para UFs sem validação', ({ assert }) => {
    const ie = '1234567' // 7 dígitos (< 8)
    assert.isFalse(IEValidator.validate(ie, 'AM'))
  })

  test('deve rejeitar IE muito longa mesmo para UFs sem validação', ({ assert }) => {
    const ie = '123456789012345' // 15 dígitos (> 14)
    assert.isFalse(IEValidator.validate(ie, 'AM'))
  })
})
