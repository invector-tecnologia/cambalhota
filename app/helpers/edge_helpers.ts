/**
 * Edge.js Helpers para formatação de números no padrão brasileiro
 *
 * Registra funções globais que podem ser usadas em qualquer template Edge
 */

import edge from 'edge.js'
import { formatDecimalBR, formatCurrencyBR } from '../helpers/number_formatter.js'

/**
 * Registra helpers de formatação no Edge.js
 */
export function registerNumberHelpers() {
  /**
   * Helper para formatar números decimais no padrão brasileiro
   *
   * @example
   * {{ formatDecimal(insumo.currentStock) }}
   * {{ formatDecimal(insumo.conversionFactor, 3) }}
   */
  edge.global('formatDecimal', (value: any, decimals: number = 2) => {
    return formatDecimalBR(value, decimals)
  })

  /**
   * Helper para formatar valores monetários no padrão brasileiro
   *
   * @example
   * {{ formatCurrency(produto.salePrice) }}
   * {{ formatCurrency(pedido.total, false) }}
   */
  edge.global('formatCurrency', (value: any, showSymbol: boolean = true) => {
    return formatCurrencyBR(value, showSymbol)
  })

  /**
   * Helper para formatar número sem casas decimais desnecessárias
   * Remove zeros à direita (10.00 -> 10, mas 10.50 -> 10,5)
   *
   * @example
   * {{ formatNumber(insumo.currentStock) }}
   */
  edge.global('formatNumber', (value: any) => {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    const numValue = typeof value === 'string' ? Number.parseFloat(value) : value

    if (Number.isNaN(numValue)) {
      return ''
    }

    // Remove zeros desnecessários
    const formatted = numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

    return formatted
  })

  /**
   * Helper para formatar timestamps como atributo data-timestamp
   * Para ser processado no cliente com timezone correto
   *
   * NOTA: As datas são renderizadas com um atributo data-timestamp
   * e depois formatadas no cliente via JavaScript para usar o timezone do usuário.
   * Isso garante que todos os horários sejam exibidos no fuso horário local.
   *
   * @example
   * {{ formatTimestamp(venda.saleDate) }}
   * Resultado: <span data-timestamp="2024-01-01T10:30:00Z"></span>
   */
  edge.global('formatTimestamp', (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '<span>--:--</span>'
    }

    // Converte para ISO string se necessário
    let isoString = value
    if (value.toISO && typeof value.toISO === 'function') {
      // Luxon DateTime
      isoString = value.toISO()
    } else if (value instanceof Date) {
      isoString = value.toISOString()
    } else if (typeof value === 'string') {
      isoString = value
    }

    return `<span data-timestamp="${isoString}"></span>`
  })

  /**
   * Helper para formatar datas completas como atributo data-timestamp
   * Para ser processado no cliente com timezone correto
   *
   * @example
   * {{ formatDateTimestamp(registro.createdAt) }}
   * Resultado: <span data-timestamp-full="2024-01-01T10:30:00Z"></span>
   */
  edge.global('formatDateTimestamp', (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '<span>-</span>'
    }

    // Converte para ISO string se necessário
    let isoString = value
    if (value.toISO && typeof value.toISO === 'function') {
      // Luxon DateTime
      isoString = value.toISO()
    } else if (value instanceof Date) {
      isoString = value.toISOString()
    } else if (typeof value === 'string') {
      isoString = value
    }

    return `<span data-timestamp-full="${isoString}"></span>`
  })

  /**
   * Helper para formatar datas (apenas data) como atributo data-timestamp-date
   * Para ser processado no cliente com timezone correto
   *
   * @example
   * {{ formatDateOnlyTimestamp(registro.registerDate) }}
   * Resultado: <span data-timestamp-date="2024-01-01T10:30:00Z"></span>
   */
  edge.global('formatDateOnlyTimestamp', (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '<span>-</span>'
    }

    let isoString = value
    if (value.toISO && typeof value.toISO === 'function') {
      isoString = value.toISO()
    } else if (value instanceof Date) {
      isoString = value.toISOString()
    } else if (typeof value === 'string') {
      isoString = value
    }

    return `<span data-timestamp-date="${isoString}"></span>`
  })
}
