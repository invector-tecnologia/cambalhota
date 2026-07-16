/**
 * Helpers para formatação de números no padrão brasileiro
 *
 * Padrão Brasileiro:
 * - Separador de milhar: . (ponto)
 * - Separador decimal: , (vírgula)
 * - Exemplo: 1.234,56
 *
 * Padrão Americano (usado no banco):
 * - Separador de milhar: , (vírgula)
 * - Separador decimal: . (ponto)
 * - Exemplo: 1,234.56
 */

/**
 * Formata número decimal para exibição no padrão brasileiro
 * @param value - Valor numérico ou string
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada no padrão BR (ex: "1.234,56")
 *
 * @example
 * formatDecimalBR(1234.56) // "1.234,56"
 * formatDecimalBR(10) // "10,00"
 * formatDecimalBR(10.5, 3) // "10,500"
 * formatDecimalBR("1234.56") // "1.234,56"
 * formatDecimalBR(null) // ""
 */
export function formatDecimalBR(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value

  if (Number.isNaN(numValue)) {
    return ''
  }

  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Formata valor monetário para exibição no padrão brasileiro
 * @param value - Valor numérico ou string
 * @param showSymbol - Se deve incluir o símbolo R$ (padrão: true)
 * @returns String formatada no padrão BR com símbolo de moeda (ex: "R$ 1.234,56")
 *
 * @example
 * formatCurrencyBR(1234.56) // "R$ 1.234,56"
 * formatCurrencyBR(1234.56, false) // "1.234,56"
 * formatCurrencyBR(10) // "R$ 10,00"
 * formatCurrencyBR("1234.56") // "R$ 1.234,56"
 * formatCurrencyBR(null) // ""
 */
export function formatCurrencyBR(
  value: number | string | null | undefined,
  showSymbol: boolean = true
): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value

  if (Number.isNaN(numValue)) {
    return ''
  }

  const formatted = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return showSymbol ? `R$ ${formatted}` : formatted
}

/**
 * Converte string formatada em padrão brasileiro para número (padrão americano)
 * Remove pontos de milhar e substitui vírgula por ponto
 * @param value - String no formato brasileiro (ex: "1.234,56")
 * @returns Número no formato americano ou null se inválido
 *
 * @example
 * parseBRToNumber("1.234,56") // 1234.56
 * parseBRToNumber("10,5") // 10.5
 * parseBRToNumber("10") // 10
 * parseBRToNumber("R$ 1.234,56") // 1234.56
 * parseBRToNumber("") // null
 * parseBRToNumber(null) // null
 */
export function parseBRToNumber(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') {
    return null
  }

  // Remove espaços, símbolo R$ e outros caracteres não numéricos (exceto . , -)
  let cleanValue = value
    .toString()
    .trim()
    .replace(/[R$\s]/g, '') // Remove R$, espaços
    .replace(/\./g, '') // Remove pontos (separador de milhar)
    .replace(',', '.') // Substitui vírgula por ponto (separador decimal)

  const numValue = Number.parseFloat(cleanValue)

  return Number.isNaN(numValue) ? null : numValue
}

/**
 * Converte string formatada em padrão brasileiro para string no padrão americano
 * Útil para enviar dados para o backend
 * @param value - String no formato brasileiro (ex: "1.234,56")
 * @returns String no formato americano ou string vazia se inválido
 *
 * @example
 * parseBRToString("1.234,56") // "1234.56"
 * parseBRToString("10,5") // "10.5"
 * parseBRToString("") // ""
 */
export function parseBRToString(value: string | null | undefined): string {
  const numValue = parseBRToNumber(value)
  return numValue !== null ? numValue.toString() : ''
}
