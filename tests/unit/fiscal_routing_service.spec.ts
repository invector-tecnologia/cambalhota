import { test } from '@japa/runner'
import FiscalRoutingService from '#services/fiscal_routing_service'

test.group('FiscalRoutingService - Validação de UFs', () => {
  test('deve suportar todas as 27 UFs brasileiras', ({ assert }) => {
    const ufs = [
      'AC',
      'AL',
      'AP',
      'AM',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MT',
      'MS',
      'MG',
      'PA',
      'PB',
      'PR',
      'PE',
      'PI',
      'RJ',
      'RN',
      'RS',
      'RO',
      'RR',
      'SC',
      'SP',
      'SE',
      'TO',
    ]

    for (const uf of ufs) {
      assert.isTrue(FiscalRoutingService.supportsNFCe(uf), `UF ${uf} deve ser suportada`)
    }
  })

  test('deve retornar false para UF inválida', ({ assert }) => {
    assert.isFalse(FiscalRoutingService.supportsNFCe('XX'))
    assert.isFalse(FiscalRoutingService.supportsNFCe('ZZ'))
    assert.isFalse(FiscalRoutingService.supportsNFCe(''))
  })

  test('deve validar formato de UF corretamente', ({ assert }) => {
    assert.isTrue(FiscalRoutingService.isValidUFFormat('SP'))
    assert.isTrue(FiscalRoutingService.isValidUFFormat('rj')) // minúscula também
    assert.isFalse(FiscalRoutingService.isValidUFFormat('S'))
    assert.isFalse(FiscalRoutingService.isValidUFFormat('SPP'))
    assert.isFalse(FiscalRoutingService.isValidUFFormat('123'))
  })

  test('deve retornar lista de UFs suportadas', ({ assert }) => {
    const ufs = FiscalRoutingService.getSupportedUFs()
    assert.isArray(ufs)
    assert.equal(ufs.length, 27)
    assert.include(ufs, 'SP')
    assert.include(ufs, 'RJ')
    assert.include(ufs, 'MG')
  })
})

test.group('FiscalRoutingService - Autorizadores', () => {
  test('deve mapear SP para SEFAZ_PROPRIA', ({ assert }) => {
    const autorizador = FiscalRoutingService.getAutorizador('SP')
    assert.equal(autorizador, 'SEFAZ_PROPRIA')
  })

  test('deve mapear AC para SVRS', ({ assert }) => {
    const autorizador = FiscalRoutingService.getAutorizador('AC')
    assert.equal(autorizador, 'SVRS')
  })

  test('deve mapear MA para SVAN', ({ assert }) => {
    const autorizador = FiscalRoutingService.getAutorizador('MA')
    assert.equal(autorizador, 'SVAN')
  })

  test('deve mapear MG para SEFAZ_PROPRIA', ({ assert }) => {
    const autorizador = FiscalRoutingService.getAutorizador('MG')
    assert.equal(autorizador, 'SEFAZ_PROPRIA')
  })

  test('deve mapear RS para SEFAZ_PROPRIA', ({ assert }) => {
    const autorizador = FiscalRoutingService.getAutorizador('RS')
    assert.equal(autorizador, 'SEFAZ_PROPRIA')
  })

  test('deve lançar erro para UF não mapeada', ({ assert }) => {
    assert.throws(() => {
      FiscalRoutingService.getAutorizador('XX')
    }, 'UF XX não está mapeada no sistema')
  })
})

test.group('FiscalRoutingService - Endpoints Homologação', () => {
  test('deve resolver endpoints SVRS para homologação - AC', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('AC', true)

    assert.isObject(endpoints)
    assert.include(endpoints.autorizacao, 'nfce-homologacao.svrs.rs.gov.br')
    assert.include(endpoints.autorizacao, 'NFeAutorizacao4')
    assert.include(endpoints.consultaProtocolo, 'NfeConsulta4')
    assert.include(endpoints.recepcaoEvento, 'NFeRecepcaoEvento4')
    assert.include(endpoints.inutilizacao, 'NFeInutilizacao4')
  })

  test('deve resolver endpoints SP para homologação', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('SP', true)

    assert.include(endpoints.autorizacao, 'homologacao.nfce.fazenda.sp.gov.br')
    assert.include(endpoints.autorizacao, 'NFeAutorizacao4')
  })

  test('deve resolver endpoints MG para homologação', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('MG', true)

    assert.include(endpoints.autorizacao, 'hnfce.fazenda.mg.gov.br')
    assert.include(endpoints.autorizacao, 'NFeAutorizacao4')
  })

  test('deve resolver endpoints SVAN para homologação - MA', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('MA', true)

    assert.include(endpoints.autorizacao, 'hom.sefazvirtual.fazenda.gov.br')
    assert.include(endpoints.autorizacao, 'NFeAutorizacao4')
  })

  test('deve resolver endpoints para todas as UFs em homologação', ({ assert }) => {
    const ufs = FiscalRoutingService.getSupportedUFs()

    for (const uf of ufs) {
      const endpoints = FiscalRoutingService.resolveEndpoints(uf, true)
      assert.isObject(endpoints)
      assert.isString(endpoints.autorizacao)
      assert.isString(endpoints.consultaProtocolo)
      assert.isNotEmpty(endpoints.autorizacao)
      assert.include(endpoints.autorizacao, 'http')
    }
  })
})

test.group('FiscalRoutingService - Endpoints Produção', () => {
  test('deve resolver endpoints SVRS para produção - TO', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('TO', false)

    assert.include(endpoints.autorizacao, 'nfce.svrs.rs.gov.br')
    assert.notInclude(endpoints.autorizacao, 'homolog')
    assert.include(endpoints.autorizacao, 'NFeAutorizacao4')
  })

  test('deve resolver endpoints SP para produção', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('SP', false)

    assert.include(endpoints.autorizacao, 'nfce.fazenda.sp.gov.br')
    assert.notInclude(endpoints.autorizacao, 'homolog')
  })

  test('deve resolver endpoints MG para produção', ({ assert }) => {
    const endpoints = FiscalRoutingService.resolveEndpoints('MG', false)

    assert.include(endpoints.autorizacao, 'nfce.fazenda.mg.gov.br')
    assert.notInclude(endpoints.autorizacao, 'homolog')
  })
})

test.group('FiscalRoutingService - Contingência', () => {
  test('deve fornecer endpoints de contingência SVCAN para homologação', ({ assert }) => {
    const endpoints = FiscalRoutingService.getContingencyEndpoints(true)

    assert.include(endpoints.autorizacao, 'hom.svc.fazenda.gov.br')
    assert.include(endpoints.autorizacao, 'NFeAutorizacao4')
  })

  test('deve fornecer endpoints de contingência SVCAN para produção', ({ assert }) => {
    const endpoints = FiscalRoutingService.getContingencyEndpoints(false)

    assert.include(endpoints.autorizacao, 'www.svc.fazenda.gov.br')
    assert.notInclude(endpoints.autorizacao, 'hom')
  })
})

test.group('FiscalRoutingService - Validações de Erro', () => {
  test('deve lançar erro ao resolver endpoints para UF não suportada', ({ assert }) => {
    assert.throws(() => {
      FiscalRoutingService.resolveEndpoints('XX', true)
    }, 'UF XX não é suportada para emissão de NFC-e')
  })

  test('deve lançar erro ao obter autorizador para UF inválida', ({ assert }) => {
    assert.throws(() => {
      FiscalRoutingService.getAutorizador('ZZ')
    }, 'UF ZZ não está mapeada no sistema')
  })

  test('deve tratar UF em minúsculas corretamente', ({ assert }) => {
    const endpointsMaiuscula = FiscalRoutingService.resolveEndpoints('SP', true)
    const endpointsMinuscula = FiscalRoutingService.resolveEndpoints('sp', true)

    assert.deepEqual(endpointsMaiuscula, endpointsMinuscula)
  })
})

test.group('FiscalRoutingService - Cobertura Completa de Estados', () => {
  test('deve mapear todos os estados do SVRS corretamente', ({ assert }) => {
    const svrsStates = [
      'AC',
      'AL',
      'AP',
      'DF',
      'ES',
      'PB',
      'RJ',
      'RN',
      'RO',
      'RR',
      'SC',
      'SE',
      'TO',
    ]

    for (const uf of svrsStates) {
      const autorizador = FiscalRoutingService.getAutorizador(uf)
      assert.equal(autorizador, 'SVRS', `${uf} deve usar SVRS`)

      const endpoints = FiscalRoutingService.resolveEndpoints(uf, true)
      assert.include(endpoints.autorizacao, 'svrs.rs.gov.br')
    }
  })

  test('deve mapear todos os estados com SEFAZ própria', ({ assert }) => {
    const sefazPropriaStates = [
      'AM',
      'BA',
      'CE',
      'GO',
      'MG',
      'MS',
      'MT',
      'PA',
      'PE',
      'PI',
      'PR',
      'RS',
      'SP',
    ]

    for (const uf of sefazPropriaStates) {
      const autorizador = FiscalRoutingService.getAutorizador(uf)
      assert.equal(autorizador, 'SEFAZ_PROPRIA', `${uf} deve usar SEFAZ_PROPRIA`)

      const endpoints = FiscalRoutingService.resolveEndpoints(uf, true)
      assert.isString(endpoints.autorizacao)
      assert.isNotEmpty(endpoints.autorizacao)
    }
  })
})
