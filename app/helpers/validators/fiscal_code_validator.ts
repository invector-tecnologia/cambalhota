/**
 * Validador de códigos fiscais NCM e CFOP
 */

export class FiscalCodeValidator {
  /**
   * Valida NCM (Nomenclatura Comum do Mercosul)
   * NCM é composto por 8 dígitos: CCPP.SS.EE
   * - CC: Capítulo (2 dígitos)
   * - PP: Posição (2 dígitos)
   * - SS: Subposição (2 dígitos)
   * - EE: Item e subitem (2 dígitos)
   *
   * @param ncm - Código NCM com ou sem pontos
   * @returns true se formato válido
   */
  static validateNCM(ncm: string): boolean {
    if (!ncm) return false

    // Remove pontos e verifica se tem 8 dígitos
    const cleaned = ncm.replace(/\D/g, '')

    if (cleaned.length !== 8) return false
    if (!/^\d{8}$/.test(cleaned)) return false

    // Verifica se o capítulo é válido (01 a 97)
    const chapter = Number.parseInt(cleaned.substring(0, 2))
    if (chapter < 1 || chapter > 97) return false

    return true
  }

  /**
   * Valida CFOP (Código Fiscal de Operações e Prestações)
   * CFOP é composto por 4 dígitos: D.ABC
   * - D: Indica operação interna (5), interestadual (6) ou exterior (7)
   * - ABC: Tipo de operação (3 dígitos)
   *
   * @param cfop - Código CFOP com ou sem ponto
   * @returns true se formato válido
   */
  static validateCFOP(cfop: string): boolean {
    if (!cfop) return false

    // Remove ponto e verifica se tem 4 dígitos
    const cleaned = cfop.replace(/\D/g, '')

    if (cleaned.length !== 4) return false
    if (!/^\d{4}$/.test(cleaned)) return false

    // Primeiro dígito deve ser 1, 2, 3, 5, 6 ou 7
    const firstDigit = Number.parseInt(cleaned[0])
    if (![1, 2, 3, 5, 6, 7].includes(firstDigit)) return false

    return true
  }

  /**
   * Valida CST ICMS (Código de Situação Tributária)
   * CST é composto por 2 dígitos para regime normal
   *
   * @param cst - Código CST (2 dígitos)
   * @returns true se válido
   */
  static validateCST(cst: string): boolean {
    if (!cst) return false

    const cleaned = cst.replace(/\D/g, '')
    if (cleaned.length !== 2) return false

    const validCSTs = ['00', '10', '20', '30', '40', '41', '50', '51', '60', '70', '90']

    return validCSTs.includes(cleaned)
  }

  /**
   * Valida CSOSN (Código de Situação da Operação no Simples Nacional)
   * CSOSN é composto por 3 dígitos
   *
   * @param csosn - Código CSOSN (3 dígitos)
   * @returns true se válido
   */
  static validateCSOSN(csosn: string): boolean {
    if (!csosn) return false

    const cleaned = csosn.replace(/\D/g, '')
    if (cleaned.length !== 3) return false

    const validCSOSNs = ['101', '102', '103', '201', '202', '203', '300', '400', '500', '900']

    return validCSOSNs.includes(cleaned)
  }

  /**
   * Valida CEST (Código Especificador da Substituição Tributária)
   * CEST é composto por 7 dígitos: CC.DDD.EE
   *
   * @param cest - Código CEST com ou sem pontos
   * @returns true se formato válido
   */
  static validateCEST(cest: string): boolean {
    if (!cest) return true // CEST é opcional

    const cleaned = cest.replace(/\D/g, '')

    if (cleaned.length !== 7) return false
    if (!/^\d{7}$/.test(cleaned)) return false

    return true
  }

  /**
   * Formata NCM para padrão CCPP.SS.EE
   */
  static formatNCM(ncm: string): string {
    const cleaned = ncm.replace(/\D/g, '')
    if (cleaned.length !== 8) return ncm
    return cleaned.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3')
  }

  /**
   * Formata CFOP para padrão D.ABC
   */
  static formatCFOP(cfop: string): string {
    const cleaned = cfop.replace(/\D/g, '')
    if (cleaned.length !== 4) return cfop
    return cleaned.replace(/^(\d)(\d{3})$/, '$1.$2')
  }

  /**
   * Formata CEST para padrão CC.DDD.EE
   */
  static formatCEST(cest: string): string {
    const cleaned = cest.replace(/\D/g, '')
    if (cleaned.length !== 7) return cest
    return cleaned.replace(/^(\d{2})(\d{3})(\d{2})$/, '$1.$2.$3')
  }

  /**
   * Retorna CFOPs comuns para restaurantes
   */
  static getCommonCFOPs(): Array<{ code: string; description: string; type: string }> {
    return [
      { code: '5101', description: 'Venda de produção do estabelecimento', type: 'interna' },
      { code: '5102', description: 'Venda de mercadoria adquirida ou recebida', type: 'interna' },
      { code: '5405', description: 'Venda de produção própria (refeições)', type: 'interna' },
      { code: '5656', description: 'Venda de combustível (se aplicável)', type: 'interna' },
      { code: '6101', description: 'Venda de produção do estabelecimento', type: 'interestadual' },
      {
        code: '6102',
        description: 'Venda de mercadoria adquirida ou recebida',
        type: 'interestadual',
      },
      { code: '6405', description: 'Venda de produção própria (refeições)', type: 'interestadual' },
    ]
  }

  /**
   * Retorna NCMs comuns para restaurantes
   */
  static getCommonNCMs(): Array<{ code: string; description: string; category: string }> {
    return [
      {
        code: '19059090',
        description: 'Produtos de panificação (pizza, pão)',
        category: 'Panificação',
      },
      { code: '16025000', description: 'Carne bovina preparada (hambúrguer)', category: 'Carnes' },
      { code: '16010010', description: 'Linguiça e produtos semelhantes', category: 'Carnes' },
      { code: '22021000', description: 'Refrigerantes', category: 'Bebidas' },
      { code: '22030000', description: 'Cervejas', category: 'Bebidas' },
      { code: '21011110', description: 'Café torrado e moído', category: 'Bebidas' },
      {
        code: '21021000',
        description: 'Extratos, essências e concentrados de chá',
        category: 'Bebidas',
      },
      { code: '20079990', description: 'Doces, geleias e purês', category: 'Doces' },
      { code: '21069090', description: 'Molhos e preparações', category: 'Condimentos' },
      { code: '07108000', description: 'Hortaliças congeladas', category: 'Legumes' },
    ]
  }

  /**
   * Retorna CSOSNs comuns para Simples Nacional
   */
  static getCommonCSOSNs(): Array<{ code: string; description: string }> {
    return [
      { code: '102', description: 'Tributada pelo Simples Nacional sem permissão de crédito' },
      {
        code: '103',
        description: 'Isenção do ICMS no Simples Nacional para faixa de receita bruta',
      },
      { code: '300', description: 'Imune (entidades sem fins lucrativos)' },
      { code: '400', description: 'Não tributada pelo Simples Nacional' },
      { code: '500', description: 'ICMS cobrado anteriormente por substituição tributária' },
    ]
  }

  /**
   * Determina CFOP automaticamente com base no estado
   * @param operationType - 'venda_producao' | 'venda_mercadoria' | 'servico'
   * @param sameState - Se emissor e destinatário são do mesmo estado
   */
  static suggestCFOP(operationType: string, sameState: boolean): string {
    const prefix = sameState ? '5' : '6'

    switch (operationType) {
      case 'venda_producao':
        return `${prefix}101` // Venda de produção
      case 'venda_mercadoria':
        return `${prefix}102` // Venda de mercadoria
      case 'servico':
        return `${prefix}405` // Venda de alimentação (restaurante)
      default:
        return `${prefix}102` // Default: venda de mercadoria
    }
  }
}
