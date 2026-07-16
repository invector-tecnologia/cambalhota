import { test } from '@japa/runner'
import FiscalTransformer from '#services/fiscal_transformer'

test.group('FiscalTransformer - Validações', () => {
  // Mock de empresa válida
  const mockEmpresaValida = {
    id: 1,
    cnpj: '12345678000195', // CNPJ válido
    razaoSocial: 'Empresa Teste Ltda',
    tradeName: 'Empresa Teste',
    ie: '110042490114', // IE válida de SP
    address: 'Rua Teste',
    addressNumber: '123',
    addressComplement: 'Sala 1',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100', // CEP válido
    codMunicipio: '3550308', // Código IBGE de São Paulo
    regimeTributario: 1, // Simples Nacional
  } as any

  // Mock de fiscal config
  const mockFiscalConfig = {
    serie: 1,
    nextNfeNumber: 1,
    isHomologacao: true,
    cscId: '1',
    cscToken: 'TEST_TOKEN',
  } as any

  // Mock de produto válido
  const mockProdutoValido = {
    id: 1,
    name: 'Produto Teste',
    ncm: '21069090', // NCM válido
    cfop: '5102', // CFOP válido
    cstIcms: '102', // CSOSN válido
    icmsRate: 0,
    pisRate: 0.65,
    cofinsRate: 3.0,
    unit: 'UN',
    barcode: '7891234567890',
    origem: 0,
  } as any

  test('deve aceitar empresa com dados válidos', async ({ assert }) => {
    const pedido = {
      id: 1,
      totalAmount: 100.0,
      taxa_servico: 0.0,
      desconto: 0,
      paymentMethod: 'dinheiro',
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: mockProdutoValido,
        },
      ],
      load: async () => {},
    } as any

    // Não deve lançar erro
    await assert.doesNotRejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    })
  })

  test('deve rejeitar empresa com CNPJ inválido', async ({ assert }) => {
    const empresaCnpjInvalido = {
      ...mockEmpresaValida,
      cnpj: '12345678000199', // CNPJ com dígito verificador errado
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, empresaCnpjInvalido, mockFiscalConfig)
    }, /CNPJ inválido/)
  })

  test('deve rejeitar empresa com IE inválida', async ({ assert }) => {
    const empresaIEInvalida = {
      ...mockEmpresaValida,
      ie: '123456789012', // IE inválida
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, empresaIEInvalida, mockFiscalConfig)
    }, /Inscrição Estadual inválida/)
  })

  test('deve aceitar IE "ISENTO"', async ({ assert }) => {
    const empresaIsentoIE = {
      ...mockEmpresaValida,
      ie: 'ISENTO',
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      taxa_servico: 0.0,
      desconto: 0,
      paymentMethod: 'dinheiro',
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: mockProdutoValido,
        },
      ],
      load: async () => {},
    } as any

    // Não deve lançar erro
    await assert.doesNotRejects(async () => {
      await FiscalTransformer.transformToXml(pedido, empresaIsentoIE, mockFiscalConfig)
    })
  })

  test('deve rejeitar empresa com CEP inválido', async ({ assert }) => {
    const empresaCepInvalido = {
      ...mockEmpresaValida,
      zipCode: '123', // CEP com tamanho incorreto
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, empresaCepInvalido, mockFiscalConfig)
    }, /CEP inválido/)
  })

  test('deve rejeitar empresa com UF inválida', async ({ assert }) => {
    const empresaUFInvalida = {
      ...mockEmpresaValida,
      state: 'ZZ', // UF inexistente
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, empresaUFInvalida, mockFiscalConfig)
    }, /UF inválida/)
  })

  test('deve rejeitar produto com NCM inválido', async ({ assert }) => {
    const produtoNCMInvalido = {
      ...mockProdutoValido,
      ncm: '123', // NCM deve ter 8 dígitos
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: produtoNCMInvalido,
        },
      ],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    }, /NCM inválido/)
  })

  test('deve rejeitar produto com CFOP inválido', async ({ assert }) => {
    const produtoCFOPInvalido = {
      ...mockProdutoValido,
      cfop: '9999', // CFOP inválido
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: produtoCFOPInvalido,
        },
      ],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    }, /CFOP inválido/)
  })

  test('deve rejeitar produto com CST/CSOSN inválido', async ({ assert }) => {
    const produtoCSTInvalido = {
      ...mockProdutoValido,
      cstIcms: '999', // CST inválido
    }

    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: produtoCSTInvalido,
        },
      ],
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    }, /Dados fiscais dos produtos/)
  })

  test('deve rejeitar CPF do destinatário inválido', async ({ assert }) => {
    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [],
      load: async () => {},
    } as any

    const cpfInvalido = '12345678900' // CPF com dígito verificador errado

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(
        pedido,
        mockEmpresaValida,
        mockFiscalConfig,
        cpfInvalido
      )
    }, /CPF do destinatário inválido/)
  })

  test('deve aceitar CPF do destinatário válido', async ({ assert }) => {
    const pedido = {
      id: 1,
      totalAmount: 100.0,
      // taxa_servico: 0.0,
      desconto: 0,
      taxa_servico: 0.0,
      paymentMethod: 'dinheiro',
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: mockProdutoValido,
        },
      ],
      load: async () => {},
    } as any

    const cpfValido = '11144477735' // CPF válido

    // Não deve lançar erro
    await assert.doesNotRejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig, cpfValido)
    })
  })

  test('deve rejeitar pedido sem itens', async ({ assert }) => {
    const pedido = {
      id: 1,
      totalAmount: 100.0,
      desconto: 0,
      items: [], // Sem itens
      load: async () => {},
    } as any

    await assert.rejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    }, /Venda não possui itens/)
  })

  test('deve ignorar totalAmount divergente (total calculado pelos itens)', async ({ assert }) => {
    const pedido = {
      id: 1,
      totalAmount: 500.0, // Valor diferente do total dos itens (100)
      desconto: 0,
      paymentMethod: 'dinheiro',
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: mockProdutoValido,
        },
      ],
      load: async () => {},
    } as any

    await assert.doesNotRejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    })
  })

  test('deve aceitar múltiplos itens com totalizadores corretos', async ({ assert }) => {
    const pedido = {
      id: 1,
      totalAmount: 300.0,
      taxa_servico: 0.0,
      desconto: 0,
      paymentMethod: 'dinheiro',
      items: [
        {
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          subtotal: 100.0,
          cardapioProduto: mockProdutoValido,
        },
        {
          quantity: 2,
          unitPrice: 100.0,
          totalPrice: 200.0,
          subtotal: 200.0,
          cardapioProduto: mockProdutoValido,
        },
      ],
      load: async () => {},
    } as any

    // Não deve lançar erro
    await assert.doesNotRejects(async () => {
      await FiscalTransformer.transformToXml(pedido, mockEmpresaValida, mockFiscalConfig)
    })
  })
})
