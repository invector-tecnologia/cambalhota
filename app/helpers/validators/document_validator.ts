/**
 * Validadores de documentos fiscais brasileiros
 * CNPJ, CPF e CEP
 */

export class DocumentValidator {
  /**
   * Remove caracteres não numéricos
   */
  private static cleanDocument(doc: string): string {
    return doc.replace(/\D/g, '')
  }

  /**
   * Valida CNPJ (Cadastro Nacional de Pessoa Jurídica)
   * @param cnpj - CNPJ com ou sem formatação
   * @returns true se válido
   */
  static validateCNPJ(cnpj: string): boolean {
    const cleaned = this.cleanDocument(cnpj)

    // Verifica se tem 14 dígitos
    if (cleaned.length !== 14) return false

    // Elimina CNPJs conhecidos como inválidos
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Validação do primeiro dígito verificador
    let length = cleaned.length - 2
    let numbers = cleaned.substring(0, length)
    const digits = cleaned.substring(length)
    let sum = 0
    let pos = length - 7

    for (let i = length; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== Number.parseInt(digits.charAt(0))) return false

    // Validação do segundo dígito verificador
    length = length + 1
    numbers = cleaned.substring(0, length)
    sum = 0
    pos = length - 7

    for (let i = length; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== Number.parseInt(digits.charAt(1))) return false

    return true
  }

  /**
   * Valida CPF (Cadastro de Pessoa Física)
   * @param cpf - CPF com ou sem formatação
   * @returns true se válido
   */
  static validateCPF(cpf: string): boolean {
    const cleaned = this.cleanDocument(cpf)

    // Verifica se tem 11 dígitos
    if (cleaned.length !== 11) return false

    // Elimina CPFs conhecidos como inválidos
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Validação do primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(cleaned.charAt(i)) * (10 - i)
    }
    let result = (sum * 10) % 11
    if (result === 10 || result === 11) result = 0
    if (result !== Number.parseInt(cleaned.charAt(9))) return false

    // Validação do segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(cleaned.charAt(i)) * (11 - i)
    }
    result = (sum * 10) % 11
    if (result === 10 || result === 11) result = 0
    if (result !== Number.parseInt(cleaned.charAt(10))) return false

    return true
  }

  /**
   * Valida CPF ou CNPJ automaticamente
   * @param document - CPF ou CNPJ
   * @returns true se válido
   */
  static validate(document: string): boolean {
    const cleaned = this.cleanDocument(document)

    if (cleaned.length === 11) {
      return this.validateCPF(document)
    } else if (cleaned.length === 14) {
      return this.validateCNPJ(document)
    }

    return false
  }

  /**
   * Valida CEP (Código de Endereçamento Postal)
   * @param cep - CEP com ou sem formatação
   * @returns true se válido
   */
  static validateCEP(cep: string): boolean {
    const cleaned = this.cleanDocument(cep)
    return cleaned.length === 8 && /^\d{8}$/.test(cleaned)
  }

  /**
   * Formata CNPJ para padrão XX.XXX.XXX/XXXX-XX
   */
  static formatCNPJ(cnpj: string): string {
    const cleaned = this.cleanDocument(cnpj)
    if (cleaned.length !== 14) return cnpj
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  /**
   * Formata CPF para padrão XXX.XXX.XXX-XX
   */
  static formatCPF(cpf: string): string {
    const cleaned = this.cleanDocument(cpf)
    if (cleaned.length !== 11) return cpf
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }

  /**
   * Formata CEP para padrão XXXXX-XXX
   */
  static formatCEP(cep: string): string {
    const cleaned = this.cleanDocument(cep)
    if (cleaned.length !== 8) return cep
    return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }
}
