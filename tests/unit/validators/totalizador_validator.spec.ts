import { test } from '@japa/runner'
import {
  TotalizadorValidator,
  type NFeItem,
  type NFeTotals,
} from '#helpers/validators/totalizador_validator'

test.group('TotalizadorValidator - Cálculo de Totais', () => {
  test('deve calcular totais corretamente a partir dos itens', ({ assert }) => {
    const items: NFeItem[] = [
      {
        vProd: 100.0,
        vDesc: 10.0,
        vFrete: 5.0,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 95.0,
        vICMS: 17.1,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 1.57,
        vCOFINS: 7.22,
      },
      {
        vProd: 50.0,
        vDesc: 0.0,
        vFrete: 0.0,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 50.0,
        vICMS: 9.0,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 0.83,
        vCOFINS: 3.8,
      },
    ]

    const totals = TotalizadorValidator.calculateTotalsFromItems(items)

    assert.equal(totals.vProd, 150.0)
    assert.equal(totals.vDesc, 10.0)
    assert.equal(totals.vFrete, 5.0)
    assert.equal(totals.vICMS, 26.1)
    assert.equal(totals.vPIS, 2.4)
    assert.equal(totals.vCOFINS, 11.02)
    assert.equal(totals.vNF, 145.0) // 150 - 10 + 5
  })

  test('deve arredondar valores para 2 casas decimais', ({ assert }) => {
    const items: NFeItem[] = [
      {
        vProd: 10.333,
        vDesc: 1.111,
        vFrete: 0.556,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 0.0,
        vICMS: 0.0,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 0.0,
        vCOFINS: 0.0,
      },
    ]

    const totals = TotalizadorValidator.calculateTotalsFromItems(items)

    assert.equal(totals.vProd, 10.33)
    assert.equal(totals.vDesc, 1.11)
    assert.equal(totals.vFrete, 0.56)
  })
})

test.group('TotalizadorValidator - Validação de Totais', () => {
  test('deve validar totais corretos', ({ assert }) => {
    const items: NFeItem[] = [
      {
        vProd: 100.0,
        vDesc: 0.0,
        vFrete: 0.0,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 100.0,
        vICMS: 18.0,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 1.65,
        vCOFINS: 7.6,
      },
    ]

    const totals: NFeTotals = {
      vProd: 100.0,
      vDesc: 0.0,
      vFrete: 0.0,
      vSeg: 0.0,
      vOutro: 0.0,
      vBC: 100.0,
      vICMS: 18.0,
      vBCST: 0.0,
      vST: 0.0,
      vIPI: 0.0,
      vPIS: 1.65,
      vCOFINS: 7.6,
      vNF: 100.0,
    }

    const result = TotalizadorValidator.validateTotals(items, totals)

    assert.isTrue(result.valid)
    assert.equal(result.errors.length, 0)
  })

  test('deve detectar divergência em vProd', ({ assert }) => {
    const items: NFeItem[] = [
      {
        vProd: 100.0,
        vDesc: 0.0,
        vFrete: 0.0,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 100.0,
        vICMS: 18.0,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 1.65,
        vCOFINS: 7.6,
      },
    ]

    const totals: NFeTotals = {
      vProd: 105.0, // ← Divergente!
      vDesc: 0.0,
      vFrete: 0.0,
      vSeg: 0.0,
      vOutro: 0.0,
      vBC: 100.0,
      vICMS: 18.0,
      vBCST: 0.0,
      vST: 0.0,
      vIPI: 0.0,
      vPIS: 1.65,
      vCOFINS: 7.6,
      vNF: 105.0,
    }

    const result = TotalizadorValidator.validateTotals(items, totals)

    assert.isFalse(result.valid)
    assert.isTrue(result.errors.length > 0)
    assert.isTrue(result.errors[0].includes('vProd divergente'))
  })

  test('deve detectar divergência em vNF', ({ assert }) => {
    const items: NFeItem[] = [
      {
        vProd: 100.0,
        vDesc: 0.0,
        vFrete: 0.0,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 100.0,
        vICMS: 18.0,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 1.65,
        vCOFINS: 7.6,
      },
    ]

    const totals: NFeTotals = {
      vProd: 100.0,
      vDesc: 0.0,
      vFrete: 0.0,
      vSeg: 0.0,
      vOutro: 0.0,
      vBC: 100.0,
      vICMS: 18.0,
      vBCST: 0.0,
      vST: 0.0,
      vIPI: 0.0,
      vPIS: 1.65,
      vCOFINS: 7.6,
      vNF: 110.0, // ← Deveria ser 100.00
    }

    const result = TotalizadorValidator.validateTotals(items, totals)

    assert.isFalse(result.valid)
    assert.isTrue(result.errors.some((e) => e.includes('vNF incorreto')))
  })

  test('deve tolerar diferença de até 2 centavos', ({ assert }) => {
    const items: NFeItem[] = [
      {
        vProd: 100.0,
        vDesc: 0.0,
        vFrete: 0.0,
        vSeg: 0.0,
        vOutro: 0.0,
        vBC: 100.0,
        vICMS: 18.0,
        vBCST: 0.0,
        vST: 0.0,
        vIPI: 0.0,
        vPIS: 1.65,
        vCOFINS: 7.6,
      },
    ]

    const totals: NFeTotals = {
      vProd: 100.01, // ← Diferença de 1 centavo (tolerável)
      vDesc: 0.0,
      vFrete: 0.0,
      vSeg: 0.0,
      vOutro: 0.0,
      vBC: 100.0,
      vICMS: 18.0,
      vBCST: 0.0,
      vST: 0.0,
      vIPI: 0.0,
      vPIS: 1.65,
      vCOFINS: 7.6,
      vNF: 100.01,
    }

    const result = TotalizadorValidator.validateTotals(items, totals)

    assert.isTrue(result.valid)
  })
})

test.group('TotalizadorValidator - Validação de Item', () => {
  test('deve validar item com valores corretos', ({ assert }) => {
    const result = TotalizadorValidator.validateItemValue(2, 50.0, 100.0)

    assert.isTrue(result.valid)
    assert.isUndefined(result.error)
  })

  test('deve detectar valor total incorreto do item', ({ assert }) => {
    const result = TotalizadorValidator.validateItemValue(2, 50.0, 105.0)

    assert.isFalse(result.valid)
    assert.isDefined(result.error)
    assert.isTrue(result.error!.includes('divergente'))
  })

  test('deve tolerar diferença de arredondamento', ({ assert }) => {
    // 3 x 10.333 = 30.999 ≈ 31.00
    const result = TotalizadorValidator.validateItemValue(3, 10.333, 31.0)

    assert.isTrue(result.valid)
  })
})

test.group('TotalizadorValidator - Cálculos Fiscais', () => {
  test('deve calcular base de cálculo ICMS corretamente', ({ assert }) => {
    const vProd = 100.0
    const vFrete = 10.0
    const vSeg = 5.0
    const vOutro = 2.0
    const vDesc = 7.0

    const bc = TotalizadorValidator.calculateICMSBase(vProd, vFrete, vSeg, vOutro, vDesc)

    // 100 + 10 + 5 + 2 - 7 = 110
    assert.equal(bc, 110.0)
  })

  test('deve calcular valor do ICMS corretamente', ({ assert }) => {
    const baseCalculo = 100.0
    const aliquota = 18.0 // 18%

    const vICMS = TotalizadorValidator.calculateICMSValue(baseCalculo, aliquota)

    assert.equal(vICMS, 18.0)
  })

  test('deve calcular valor do PIS corretamente', ({ assert }) => {
    const baseCalculo = 100.0
    const aliquota = 1.65 // 1.65%

    const vPIS = TotalizadorValidator.calculatePISValue(baseCalculo, aliquota)

    assert.equal(vPIS, 1.65)
  })

  test('deve calcular valor do COFINS corretamente', ({ assert }) => {
    const baseCalculo = 100.0
    const aliquota = 7.6 // 7.60%

    const vCOFINS = TotalizadorValidator.calculateCOFINSValue(baseCalculo, aliquota)

    assert.equal(vCOFINS, 7.6)
  })

  test('deve arredondar corretamente valores com muitas casas decimais', ({ assert }) => {
    const baseCalculo = 33.33
    const aliquota = 18.0

    const vICMS = TotalizadorValidator.calculateICMSValue(baseCalculo, aliquota)

    // 33.33 * 0.18 = 5.9994 ≈ 6.00
    assert.equal(vICMS, 6.0)
  })
})
