/**
 * Validador de Inscrição Estadual (IE) por Unidade Federativa
 * Cada UF tem seu próprio algoritmo de validação
 */

export class IEValidator {
  /**
   * Remove caracteres não alfanuméricos
   */
  private static clean(ie: string): string {
    return ie.replace(/[^\dA-Z]/gi, '').toUpperCase()
  }

  /**
   * Valida IE automaticamente detectando UF
   * @param ie - Inscrição Estadual
   * @param uf - Sigla do estado (2 letras)
   * @returns true se válido
   */
  static validate(ie: string, uf: string): boolean {
    if (!ie || !uf) return false

    const cleaned = this.clean(ie)

    // IE "ISENTO" é válida
    if (cleaned === 'ISENTO') return true

    const methodName = `validate${uf.toUpperCase()}` as keyof typeof IEValidator
    const method = IEValidator[methodName]

    if (typeof method === 'function') {
      return (method as (ie: string) => boolean).call(IEValidator, cleaned)
    }

    // UF não implementada - aceita qualquer IE
    console.warn(`Validação de IE para ${uf} não implementada`)
    return cleaned.length > 0
  }

  /**
   * Acre (AC) - 13 dígitos
   */
  static validateAC(ie: string): boolean {
    if (ie.length !== 13) return false
    if (!ie.startsWith('01')) return false

    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const digits = ie.substring(0, 11)
    let sum = 0

    for (let i = 0; i < 11; i++) {
      sum += Number.parseInt(digits[i]) * weights[i]
    }

    const firstDigit = 11 - (sum % 11)
    const calculatedFirst = firstDigit >= 10 ? 0 : firstDigit

    if (calculatedFirst !== Number.parseInt(ie[11])) return false

    // Segundo dígito
    const weights2 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0

    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(ie[i]) * weights2[i]
    }

    const secondDigit = 11 - (sum % 11)
    const calculatedSecond = secondDigit >= 10 ? 0 : secondDigit

    return calculatedSecond === Number.parseInt(ie[12])
  }

  /**
   * São Paulo (SP) - 12 dígitos
   */
  static validateSP(ie: string): boolean {
    if (ie.length !== 12) return false

    // Primeiro dígito
    const weights1 = [1, 3, 4, 5, 6, 7, 8, 10]
    let sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number.parseInt(ie[i]) * weights1[i]
    }

    let digit = sum % 11
    const calculatedFirst = digit >= 10 ? 0 : digit

    if (calculatedFirst !== Number.parseInt(ie[8])) return false

    // Segundo dígito
    const weights2 = [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0

    for (let i = 0; i < 11; i++) {
      sum += Number.parseInt(ie[i]) * weights2[i]
    }

    digit = sum % 11
    const calculatedSecond = digit >= 10 ? 0 : digit

    return calculatedSecond === Number.parseInt(ie[11])
  }

  /**
   * Rio de Janeiro (RJ) - 8 dígitos
   */
  static validateRJ(ie: string): boolean {
    if (ie.length !== 8) return false

    const weights = [2, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 7; i++) {
      sum += Number.parseInt(ie[i]) * weights[i]
    }

    const digit = 11 - (sum % 11)
    const calculated = digit >= 10 ? 0 : digit

    return calculated === Number.parseInt(ie[7])
  }

  /**
   * Minas Gerais (MG) - 13 dígitos
   */
  static validateMG(ie: string): boolean {
    if (ie.length !== 13) return false

    // Primeiro dígito
    const ieWithZero = ie.substring(0, 3) + '0' + ie.substring(3, 12)
    const weights1 = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
    let sum = 0

    for (let i = 0; i < 12; i++) {
      let product = Number.parseInt(ieWithZero[i]) * weights1[i]
      sum += product >= 10 ? Math.floor(product / 10) + (product % 10) : product
    }

    const digit1 = (Math.floor(sum / 10) + 1) * 10 - sum
    const calculatedFirst = digit1 >= 10 ? 0 : digit1

    if (calculatedFirst !== Number.parseInt(ie[11])) return false

    // Segundo dígito
    const weights2 = [3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0

    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(ie[i]) * weights2[i]
    }

    const digit2 = 11 - (sum % 11)
    const calculatedSecond = digit2 >= 10 ? 0 : digit2

    return calculatedSecond === Number.parseInt(ie[12])
  }

  /**
   * Rio Grande do Sul (RS) - 10 dígitos
   */
  static validateRS(ie: string): boolean {
    if (ie.length !== 10) return false

    const weights = [2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(ie[i]) * weights[i]
    }

    const digit = 11 - (sum % 11)
    const calculated = digit >= 10 ? 0 : digit

    return calculated === Number.parseInt(ie[9])
  }

  /**
   * Paraná (PR) - 10 dígitos
   */
  static validatePR(ie: string): boolean {
    if (ie.length !== 10) return false

    // Primeiro dígito
    const weights1 = [3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number.parseInt(ie[i]) * weights1[i]
    }

    const digit1 = 11 - (sum % 11)
    const calculatedFirst = digit1 >= 10 ? 0 : digit1

    if (calculatedFirst !== Number.parseInt(ie[8])) return false

    // Segundo dígito
    const weights2 = [4, 3, 2, 7, 6, 5, 4, 3, 2]
    sum = 0

    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(ie[i]) * weights2[i]
    }

    const digit2 = 11 - (sum % 11)
    const calculatedSecond = digit2 >= 10 ? 0 : digit2

    return calculatedSecond === Number.parseInt(ie[9])
  }

  /**
   * Santa Catarina (SC) - 9 dígitos
   */
  static validateSC(ie: string): boolean {
    if (ie.length !== 9) return false

    const weights = [9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number.parseInt(ie[i]) * weights[i]
    }

    const digit = 11 - (sum % 11)
    const calculated = digit >= 10 ? 0 : digit

    return calculated === Number.parseInt(ie[8])
  }

  /**
   * Bahia (BA) - 8 ou 9 dígitos
   */
  static validateBA(ie: string): boolean {
    if (ie.length !== 8 && ie.length !== 9) return false

    const secondDigit = Number.parseInt(ie[ie.length === 8 ? 0 : 1])
    const modulo = [6, 7, 8].includes(secondDigit) ? 10 : 11

    // Segundo dígito verificador (penúltimo)
    const weights1 = ie.length === 8 ? [7, 6, 5, 4, 3, 2] : [8, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (const [i, element] of weights1.entries()) {
      sum += Number.parseInt(ie[i]) * element
    }

    const digit1 = modulo - (sum % modulo)
    const calculatedFirst = digit1 >= modulo ? 0 : digit1

    if (calculatedFirst !== Number.parseInt(ie[ie.length - 2])) return false

    // Primeiro dígito verificador (último)
    const weights2 = ie.length === 8 ? [8, 7, 6, 5, 4, 3, 0, 2] : [9, 8, 7, 6, 5, 4, 3, 0, 2]
    sum = 0

    for (const [i, element] of weights2.entries()) {
      sum += Number.parseInt(ie[i]) * element
    }

    const digit2 = modulo - (sum % modulo)
    const calculatedSecond = digit2 >= modulo ? 0 : digit2

    return calculatedSecond === Number.parseInt(ie[ie.length - 1])
  }

  /**
   * Goiás (GO) - 9 dígitos
   */
  static validateGO(ie: string): boolean {
    if (ie.length !== 9) return false

    const base = ie.substring(0, 8)
    const weights = [9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number.parseInt(base[i]) * weights[i]
    }

    const rest = sum % 11
    let calculated: number

    if (rest === 0) {
      calculated = 0
    } else if (rest === 1) {
      const ieNum = Number.parseInt(ie.substring(0, 8))
      if (ieNum >= 10103105 && ieNum <= 10119997) {
        calculated = 1
      } else {
        calculated = 0
      }
    } else {
      calculated = 11 - rest
    }

    return calculated === Number.parseInt(ie[8])
  }

  /**
   * Ceará (CE) - 9 dígitos
   */
  static validateCE(ie: string): boolean {
    if (ie.length !== 9) return false

    const weights = [9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number.parseInt(ie[i]) * weights[i]
    }

    const digit = 11 - (sum % 11)
    const calculated = digit >= 10 ? 0 : digit

    return calculated === Number.parseInt(ie[8])
  }

  /**
   * Pernambuco (PE) - 9 dígitos (formato: 0000000-DD)
   */
  static validatePE(ie: string): boolean {
    if (ie.length !== 9) return false

    // Primeiro dígito
    const weights1 = [8, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 7; i++) {
      sum += Number.parseInt(ie[i]) * weights1[i]
    }

    const digit1 = 11 - (sum % 11)
    const calculatedFirst = digit1 >= 10 ? digit1 - 10 : digit1

    if (calculatedFirst !== Number.parseInt(ie[7])) return false

    // Segundo dígito
    const weights2 = [9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number.parseInt(ie[i]) * weights2[i]
    }

    const digit2 = 11 - (sum % 11)
    const calculatedSecond = digit2 >= 10 ? digit2 - 10 : digit2

    return calculatedSecond === Number.parseInt(ie[8])
  }

  /**
   * Validação genérica para UFs não implementadas
   * Aceita qualquer IE com 8-14 dígitos
   */
  private static validateGeneric(ie: string): boolean {
    return ie.length >= 8 && ie.length <= 14 && /^\d+$/.test(ie)
  }

  // Aliases para UFs não implementadas (usa validação genérica)
  static validateAL = IEValidator.validateGeneric
  static validateAM = IEValidator.validateGeneric
  static validateAP = IEValidator.validateGeneric
  static validateDF = IEValidator.validateGeneric
  static validateES = IEValidator.validateGeneric
  static validateMA = IEValidator.validateGeneric
  static validateMS = IEValidator.validateGeneric
  static validateMT = IEValidator.validateGeneric
  static validatePA = IEValidator.validateGeneric
  static validatePB = IEValidator.validateGeneric
  static validatePI = IEValidator.validateGeneric
  static validateRN = IEValidator.validateGeneric
  static validateRO = IEValidator.validateGeneric
  static validateRR = IEValidator.validateGeneric
  static validateSE = IEValidator.validateGeneric
  static validateTO = IEValidator.validateGeneric
}
