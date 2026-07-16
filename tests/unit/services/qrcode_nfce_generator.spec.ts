import { test } from '@japa/runner'
import QRCodeNFCeGenerator from '#services/qrcode_nfce_generator'

test.group('QRCodeNFCeGenerator', () => {
  // Mock de empresa
  const mockEmpresa = {
    state: 'SP',
    name: 'Empresa Teste',
    cnpj: '12345678000195',
  } as any

  // Mock de FiscalConfig
  const mockFiscalConfig = {
    cscId: '1',
    cscToken: 'ABCD1234EFGH5678',
  } as any

  test('deve gerar URL QR Code V2 ONLINE com pipes literais', ({ assert }) => {
    const chaveAcesso = '35240112345678000195650010000000011234567890'
    const tpAmb = 1 // Produção
    const dhEmi = '2024-01-15T14:30:00-03:00'
    const vNF = 150.0
    const digVal = 'dGVzdGVkaWdlc3R2YWx1ZQ=='

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      chaveAcesso,
      tpAmb,
      dhEmi,
      vNF,
      digVal,
      mockEmpresa,
      mockFiscalConfig
    )

    // URL base SP produção (NfeConsultaQR)
    assert.include(qrCodeUrl, 'https://www.nfce.fazenda.sp.gov.br/qrcode')

    // Formato: ?p=CHAVE|VERSAO|TPAMB|CSCID|HASH
    assert.match(
      qrCodeUrl,
      /\?p=35240112345678000195650010000000011234567890\|2\|1\|1\|[A-F0-9]{40}$/
    )

    // NÃO deve ter %7C (pipe codificado) nem &c= (hash separada)
    assert.notInclude(qrCodeUrl, '%7C')
    assert.notInclude(qrCodeUrl, '&c=')
    assert.notInclude(qrCodeUrl, '&amp;')
  })

  test('deve gerar URL para homologação', ({ assert }) => {
    const chaveAcesso = '35240112345678000195650010000000011234567890'
    const tpAmb = 2 // Homologação

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      chaveAcesso,
      tpAmb,
      '2024-01-15T14:30:00-03:00',
      150.0,
      'dGVzdGVkaWdlc3R2YWx1ZQ==',
      mockEmpresa,
      mockFiscalConfig
    )

    // URL base homologação
    assert.include(qrCodeUrl, 'https://www.homologacao.nfce.fazenda.sp.gov.br')

    // Ambiente 2 no pipe
    assert.match(qrCodeUrl, /\|2\|2\|/)
  })

  test('deve gerar URL para MG', ({ assert }) => {
    const empresaMG = { ...mockEmpresa, state: 'MG' }
    const chaveAcesso = '31240112345678000195650010000000011234567890'

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      chaveAcesso,
      1,
      '2024-01-15T14:30:00-03:00',
      200.5,
      'dGVzdGVkaWdlc3R2YWx1ZQ==',
      empresaMG,
      mockFiscalConfig
    )

    assert.include(qrCodeUrl, 'https://portalsped.fazenda.mg.gov.br/portalnfce')
  })

  test('deve gerar URL para RS (SVRS)', ({ assert }) => {
    const empresaRS = { ...mockEmpresa, state: 'RS' }
    const chaveAcesso = '43240112345678000195650010000000011234567890'

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      chaveAcesso,
      1,
      '2024-01-15T14:30:00-03:00',
      99.9,
      'dGVzdGVkaWdlc3R2YWx1ZQ==',
      empresaRS,
      mockFiscalConfig
    )

    assert.include(qrCodeUrl, 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx')
  })

  test('deve rejeitar chave de acesso com tamanho inválido', ({ assert }) => {
    assert.throws(() => {
      QRCodeNFCeGenerator.generate('123456789', 1, '', 0, '', mockEmpresa, mockFiscalConfig)
    }, 'Chave de acesso inválida: deve ter 44 dígitos')
  })

  test('deve rejeitar tipo de ambiente inválido', ({ assert }) => {
    const chaveAcesso = '35240112345678000195650010000000011234567890'
    assert.throws(() => {
      QRCodeNFCeGenerator.generate(chaveAcesso, 3 as any, '', 0, '', mockEmpresa, mockFiscalConfig)
    }, 'Tipo de ambiente inválido')
  })

  test('deve rejeitar empresa sem UF', ({ assert }) => {
    const empresaSemUF = { ...mockEmpresa, state: undefined }
    const chaveAcesso = '35240112345678000195650010000000011234567890'
    assert.throws(() => {
      QRCodeNFCeGenerator.generate(chaveAcesso, 1, '', 0, '', empresaSemUF as any, mockFiscalConfig)
    }, 'UF da empresa não informada')
  })

  test('deve rejeitar UF não suportada', ({ assert }) => {
    const empresaZZ = { ...mockEmpresa, state: 'ZZ' }
    const chaveAcesso = '35240112345678000195650010000000011234567890'
    assert.throws(() => {
      QRCodeNFCeGenerator.generate(chaveAcesso, 1, '', 0, '', empresaZZ as any, mockFiscalConfig)
    }, 'UF não suportada para QR Code NFC-e')
  })

  test('deve rejeitar FiscalConfig sem CSC Token', ({ assert }) => {
    const fiscalSemCSC = { ...mockFiscalConfig, cscToken: '' }
    const chaveAcesso = '35240112345678000195650010000000011234567890'
    assert.throws(() => {
      QRCodeNFCeGenerator.generate(chaveAcesso, 1, '', 0, '', mockEmpresa, fiscalSemCSC as any)
    }, 'CSC Token não configurado')
  })

  test('deve gerar hash SHA-1 de 40 chars uppercase no último campo', ({ assert }) => {
    const chaveAcesso = '35240112345678000195650010000000011234567890'

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      chaveAcesso,
      1,
      '2024-01-15T14:30:00-03:00',
      150.0,
      'dGVzdGVkaWdlc3R2YWx1ZQ==',
      mockEmpresa,
      mockFiscalConfig
    )

    // Último campo após o último pipe = hash SHA-1 de 40 hex chars uppercase
    const match = qrCodeUrl.match(/\|([A-F0-9]{40})$/)
    assert.isNotNull(match, 'Hash SHA-1 deve ser o último campo com 40 hex chars')
    if (match) {
      assert.notMatch(match[1], /[a-f]/, 'Hash deve ser uppercase')
    }
  })

  test('deve usar CSC ID personalizado', ({ assert }) => {
    const fiscalCustom = { cscId: '123', cscToken: 'CUSTOM_TOKEN' } as any
    const chaveAcesso = '35240112345678000195650010000000011234567890'

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      chaveAcesso,
      1,
      '2024-01-15T14:30:00-03:00',
      150.0,
      'dGVzdGVkaWdlc3R2YWx1ZQ==',
      mockEmpresa,
      fiscalCustom
    )

    // CSC ID 123 deve aparecer antes do hash
    assert.match(qrCodeUrl, /\|123\|[A-F0-9]{40}$/)
  })

  test('deve validar se UF é suportada', ({ assert }) => {
    assert.isTrue(QRCodeNFCeGenerator.isUFSupported('SP'))
    assert.isTrue(QRCodeNFCeGenerator.isUFSupported('MG'))
    assert.isTrue(QRCodeNFCeGenerator.isUFSupported('RS'))
    assert.isTrue(QRCodeNFCeGenerator.isUFSupported('AC'))
    assert.isFalse(QRCodeNFCeGenerator.isUFSupported('ZZ'))
    assert.isFalse(QRCodeNFCeGenerator.isUFSupported(''))
  })

  test('deve listar todas as UFs suportadas', ({ assert }) => {
    const ufs = QRCodeNFCeGenerator.getSupportedUFs()
    assert.isArray(ufs)
    assert.lengthOf(ufs, 27)
    assert.include(ufs, 'SP')
    assert.include(ufs, 'RJ')
    assert.include(ufs, 'RS')
  })
})
