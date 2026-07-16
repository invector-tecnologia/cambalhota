import { test } from '@japa/runner'
import { DocumentValidator } from '#helpers/validators/document_validator'

test.group('DocumentValidator - CNPJ', () => {
  test('deve validar CNPJ válido sem formatação', ({ assert }) => {
    const cnpj = '11222333000181'
    assert.isTrue(DocumentValidator.validateCNPJ(cnpj))
  })

  test('deve validar CNPJ válido com formatação', ({ assert }) => {
    const cnpj = '11.222.333/0001-81'
    assert.isTrue(DocumentValidator.validateCNPJ(cnpj))
  })

  test('deve rejeitar CNPJ com dígito verificador incorreto', ({ assert }) => {
    const cnpj = '11222333000180' // último dígito errado
    assert.isFalse(DocumentValidator.validateCNPJ(cnpj))
  })

  test('deve rejeitar CNPJ com todos os dígitos iguais', ({ assert }) => {
    const cnpjs = ['00000000000000', '11111111111111', '22222222222222']
    for (const cnpj of cnpjs) {
      assert.isFalse(DocumentValidator.validateCNPJ(cnpj))
    }
  })

  test('deve rejeitar CNPJ com tamanho incorreto', ({ assert }) => {
    const cnpjs = ['123', '1234567890123', '123456789012345']
    for (const cnpj of cnpjs) {
      assert.isFalse(DocumentValidator.validateCNPJ(cnpj))
    }
  })

  test('deve formatar CNPJ corretamente', ({ assert }) => {
    const cnpj = '11222333000181'
    const formatted = DocumentValidator.formatCNPJ(cnpj)
    assert.equal(formatted, '11.222.333/0001-81')
  })

  test('CNPJs reais válidos', ({ assert }) => {
    const cnpjsValidos = [
      '00000000000191', // CNPJ válido
      '11222333000181',
      '34028316000103', // Correios
    ]

    for (const cnpj of cnpjsValidos) {
      assert.isTrue(DocumentValidator.validateCNPJ(cnpj), `CNPJ ${cnpj} deveria ser válido`)
    }
  })
})

test.group('DocumentValidator - CPF', () => {
  test('deve validar CPF válido sem formatação', ({ assert }) => {
    const cpf = '12345678909'
    assert.isTrue(DocumentValidator.validateCPF(cpf))
  })

  test('deve validar CPF válido com formatação', ({ assert }) => {
    const cpf = '123.456.789-09'
    assert.isTrue(DocumentValidator.validateCPF(cpf))
  })

  test('deve rejeitar CPF com dígito verificador incorreto', ({ assert }) => {
    const cpf = '12345678908' // último dígito errado
    assert.isFalse(DocumentValidator.validateCPF(cpf))
  })

  test('deve rejeitar CPF com todos os dígitos iguais', ({ assert }) => {
    const cpfs = ['00000000000', '11111111111', '22222222222', '33333333333', '44444444444']
    for (const cpf of cpfs) {
      assert.isFalse(DocumentValidator.validateCPF(cpf))
    }
  })

  test('deve rejeitar CPF com tamanho incorreto', ({ assert }) => {
    const cpfs = ['123', '1234567890', '123456789012']
    for (const cpf of cpfs) {
      assert.isFalse(DocumentValidator.validateCPF(cpf))
    }
  })

  test('deve formatar CPF corretamente', ({ assert }) => {
    const cpf = '12345678909'
    const formatted = DocumentValidator.formatCPF(cpf)
    assert.equal(formatted, '123.456.789-09')
  })

  test('CPFs reais válidos', ({ assert }) => {
    const cpfsValidos = [
      '12345678909',
      '11144477735', // CPF válido
    ]

    for (const cpf of cpfsValidos) {
      assert.isTrue(DocumentValidator.validateCPF(cpf), `CPF ${cpf} deveria ser válido`)
    }
  })
})

test.group('DocumentValidator - CPF/CNPJ Automático', () => {
  test('deve detectar e validar CPF automaticamente', ({ assert }) => {
    const cpf = '12345678909'
    assert.isTrue(DocumentValidator.validate(cpf))
  })

  test('deve detectar e validar CNPJ automaticamente', ({ assert }) => {
    const cnpj = '11222333000181'
    assert.isTrue(DocumentValidator.validate(cnpj))
  })

  test('deve rejeitar documento com tamanho inválido', ({ assert }) => {
    const doc = '123456789012' // 12 dígitos
    assert.isFalse(DocumentValidator.validate(doc))
  })
})

test.group('DocumentValidator - CEP', () => {
  test('deve validar CEP válido sem formatação', ({ assert }) => {
    const cep = '01310100'
    assert.isTrue(DocumentValidator.validateCEP(cep))
  })

  test('deve validar CEP válido com formatação', ({ assert }) => {
    const cep = '01310-100'
    assert.isTrue(DocumentValidator.validateCEP(cep))
  })

  test('deve rejeitar CEP com tamanho incorreto', ({ assert }) => {
    const ceps = ['123', '1234567', '123456789']
    for (const cep of ceps) {
      assert.isFalse(DocumentValidator.validateCEP(cep))
    }
  })

  test('deve rejeitar CEP com caracteres não numéricos', ({ assert }) => {
    const cep = '0131A-100'
    assert.isFalse(DocumentValidator.validateCEP(cep))
  })

  test('deve formatar CEP corretamente', ({ assert }) => {
    const cep = '01310100'
    const formatted = DocumentValidator.formatCEP(cep)
    assert.equal(formatted, '01310-100')
  })
})
