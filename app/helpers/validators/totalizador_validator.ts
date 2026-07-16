/**
 * Validador de totalizadores de NF-e/NFC-e
 * Garante que os valores somam corretamente
 */

export interface NFeTotals {
  vProd: number // Total dos produtos
  vDesc: number // Total de descontos
  vFrete: number // Total de frete
  vSeg: number // Total de seguro
  vOutro: number // Outras despesas
  vBC: number // Base de cálculo ICMS
  vICMS: number // Total ICMS
  vBCST: number // Base de cálculo ICMS ST
  vST: number // Total ICMS ST
  vIPI: number // Total IPI
  vPIS: number // Total PIS
  vCOFINS: number // Total COFINS
  vNF: number // Valor total da nota
}

export interface NFeItem {
  vProd: number // Valor total do item (qCom * vUnCom)
  vDesc: number // Desconto do item
  vFrete: number // Frete do item
  vSeg: number // Seguro do item
  vOutro: number // Outras despesas do item
  vBC: number // Base de cálculo ICMS do item
  vICMS: number // ICMS do item
  vBCST: number // Base de cálculo ICMS ST do item
  vST: number // ICMS ST do item
  vIPI: number // IPI do item
  vPIS: number // PIS do item
  vCOFINS: number // COFINS do item
}

export class TotalizadorValidator {
  /**
   * Tolerância para comparação de valores monetários (2 centavos)
   */
  private static readonly TOLERANCE = 0.02

  /**
   * Compara dois valores com tolerância
   */
  private static equals(a: number, b: number): boolean {
    return Math.abs(a - b) <= this.TOLERANCE
  }

  /**
   * Arredonda valor para 2 casas decimais
   */
  private static round(value: number): number {
    return Math.round(value * 100) / 100
  }

  /**
   * Valida se os totalizadores batem com a soma dos itens
   * @param items - Itens da nota
   * @param totals - Totalizadores declarados
   * @returns Objeto com resultado e erros
   */
  static validateTotals(items: NFeItem[], totals: NFeTotals): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Calcula totais a partir dos itens
    const calculated = this.calculateTotalsFromItems(items)

    // Valida cada campo
    if (!this.equals(calculated.vProd, totals.vProd)) {
      errors.push(
        `vProd divergente: Calculado=${calculated.vProd.toFixed(2)} Declarado=${totals.vProd.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vDesc, totals.vDesc)) {
      errors.push(
        `vDesc divergente: Calculado=${calculated.vDesc.toFixed(2)} Declarado=${totals.vDesc.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vFrete, totals.vFrete)) {
      errors.push(
        `vFrete divergente: Calculado=${calculated.vFrete.toFixed(2)} Declarado=${totals.vFrete.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vSeg, totals.vSeg)) {
      errors.push(
        `vSeg divergente: Calculado=${calculated.vSeg.toFixed(2)} Declarado=${totals.vSeg.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vOutro, totals.vOutro)) {
      errors.push(
        `vOutro divergente: Calculado=${calculated.vOutro.toFixed(2)} Declarado=${totals.vOutro.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vBC, totals.vBC)) {
      errors.push(
        `vBC (ICMS) divergente: Calculado=${calculated.vBC.toFixed(2)} Declarado=${totals.vBC.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vICMS, totals.vICMS)) {
      errors.push(
        `vICMS divergente: Calculado=${calculated.vICMS.toFixed(2)} Declarado=${totals.vICMS.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vBCST, totals.vBCST)) {
      errors.push(
        `vBCST divergente: Calculado=${calculated.vBCST.toFixed(2)} Declarado=${totals.vBCST.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vST, totals.vST)) {
      errors.push(
        `vST (ICMS ST) divergente: Calculado=${calculated.vST.toFixed(2)} Declarado=${totals.vST.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vIPI, totals.vIPI)) {
      errors.push(
        `vIPI divergente: Calculado=${calculated.vIPI.toFixed(2)} Declarado=${totals.vIPI.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vPIS, totals.vPIS)) {
      errors.push(
        `vPIS divergente: Calculado=${calculated.vPIS.toFixed(2)} Declarado=${totals.vPIS.toFixed(2)}`
      )
    }

    if (!this.equals(calculated.vCOFINS, totals.vCOFINS)) {
      errors.push(
        `vCOFINS divergente: Calculado=${calculated.vCOFINS.toFixed(2)} Declarado=${totals.vCOFINS.toFixed(2)}`
      )
    }

    // Valida valor total da nota
    const expectedTotal =
      totals.vProd -
      totals.vDesc +
      totals.vFrete +
      totals.vSeg +
      totals.vOutro +
      totals.vST +
      totals.vIPI

    if (!this.equals(expectedTotal, totals.vNF)) {
      errors.push(
        `vNF incorreto: Esperado=${expectedTotal.toFixed(2)} (vProd - vDesc + vFrete + vSeg + vOutro + vST + vIPI) Declarado=${totals.vNF.toFixed(2)}`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Calcula totalizadores a partir dos itens
   */
  static calculateTotalsFromItems(items: NFeItem[]): NFeTotals {
    const totals: NFeTotals = {
      vProd: 0,
      vDesc: 0,
      vFrete: 0,
      vSeg: 0,
      vOutro: 0,
      vBC: 0,
      vICMS: 0,
      vBCST: 0,
      vST: 0,
      vIPI: 0,
      vPIS: 0,
      vCOFINS: 0,
      vNF: 0,
    }

    for (const item of items) {
      totals.vProd += item.vProd || 0
      totals.vDesc += item.vDesc || 0
      totals.vFrete += item.vFrete || 0
      totals.vSeg += item.vSeg || 0
      totals.vOutro += item.vOutro || 0
      totals.vBC += item.vBC || 0
      totals.vICMS += item.vICMS || 0
      totals.vBCST += item.vBCST || 0
      totals.vST += item.vST || 0
      totals.vIPI += item.vIPI || 0
      totals.vPIS += item.vPIS || 0
      totals.vCOFINS += item.vCOFINS || 0
    }

    // Arredonda todos os valores
    totals.vProd = this.round(totals.vProd)
    totals.vDesc = this.round(totals.vDesc)
    totals.vFrete = this.round(totals.vFrete)
    totals.vSeg = this.round(totals.vSeg)
    totals.vOutro = this.round(totals.vOutro)
    totals.vBC = this.round(totals.vBC)
    totals.vICMS = this.round(totals.vICMS)
    totals.vBCST = this.round(totals.vBCST)
    totals.vST = this.round(totals.vST)
    totals.vIPI = this.round(totals.vIPI)
    totals.vPIS = this.round(totals.vPIS)
    totals.vCOFINS = this.round(totals.vCOFINS)

    // Calcula valor total da nota
    totals.vNF = this.round(
      totals.vProd -
        totals.vDesc +
        totals.vFrete +
        totals.vSeg +
        totals.vOutro +
        totals.vST +
        totals.vIPI
    )

    return totals
  }

  /**
   * Valida quantidade e valor unitário de um item
   * @param quantidade - Quantidade do item
   * @param valorUnitario - Valor unitário
   * @param valorTotal - Valor total declarado
   */
  static validateItemValue(
    quantidade: number,
    valorUnitario: number,
    valorTotal: number
  ): { valid: boolean; error?: string } {
    const calculated = this.round(quantidade * valorUnitario)

    if (!this.equals(calculated, valorTotal)) {
      return {
        valid: false,
        error: `Valor total do item divergente: ${quantidade} x ${valorUnitario.toFixed(2)} = ${calculated.toFixed(2)} (declarado: ${valorTotal.toFixed(2)})`,
      }
    }

    return { valid: true }
  }

  /**
   * Calcula base de cálculo ICMS
   * @param vProd - Valor do produto
   * @param vFrete - Valor do frete
   * @param vSeg - Valor do seguro
   * @param vOutro - Outras despesas
   * @param vDesc - Desconto
   */
  static calculateICMSBase(
    vProd: number,
    vFrete: number = 0,
    vSeg: number = 0,
    vOutro: number = 0,
    vDesc: number = 0
  ): number {
    return this.round(vProd + vFrete + vSeg + vOutro - vDesc)
  }

  /**
   * Calcula valor do ICMS
   * @param baseCalculoICMS - Base de cálculo
   * @param aliquotaICMS - Alíquota em porcentagem (ex: 18 para 18%)
   */
  static calculateICMSValue(baseCalculoICMS: number, aliquotaICMS: number): number {
    return this.round(baseCalculoICMS * (aliquotaICMS / 100))
  }

  /**
   * Calcula valor do PIS
   * @param baseCalculoPIS - Base de cálculo
   * @param aliquotaPIS - Alíquota em porcentagem
   */
  static calculatePISValue(baseCalculoPIS: number, aliquotaPIS: number): number {
    return this.round(baseCalculoPIS * (aliquotaPIS / 100))
  }

  /**
   * Calcula valor do COFINS
   * @param baseCalculoCOFINS - Base de cálculo
   * @param aliquotaCOFINS - Alíquota em porcentagem
   */
  static calculateCOFINSValue(baseCalculoCOFINS: number, aliquotaCOFINS: number): number {
    return this.round(baseCalculoCOFINS * (aliquotaCOFINS / 100))
  }
}
