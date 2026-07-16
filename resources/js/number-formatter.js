/**
 * Helpers JavaScript para formatação de números no padrão brasileiro
 * Uso em formulários e máscaras de input
 */

/**
 * Formata número decimal para exibição no padrão brasileiro
 * @param {number|string} value - Valor numérico ou string
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} String formatada no padrão BR (ex: "1.234,56")
 */
window.formatDecimalBR = function (value, decimals = 2) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return ''
  }

  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Formata valor monetário para exibição no padrão brasileiro
 * @param {number|string} value - Valor numérico ou string
 * @param {boolean} showSymbol - Se deve incluir o símbolo R$ (padrão: true)
 * @returns {string} String formatada no padrão BR com símbolo de moeda (ex: "R$ 1.234,56")
 */
window.formatCurrencyBR = function (value, showSymbol = true) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
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
 * @param {string} value - String no formato brasileiro (ex: "1.234,56")
 * @returns {number|null} Número no formato americano ou null se inválido
 */
window.parseBRToNumber = function (value) {
  if (!value || value.toString().trim() === '') {
    return null
  }

  // Remove espaços, símbolo R$ e outros caracteres não numéricos
  const cleanValue = value
    .toString()
    .trim()
    .replace(/[R$\s]/g, '') // Remove R$, espaços
    .replace(/\./g, '') // Remove pontos (separador de milhar)
    .replace(',', '.') // Substitui vírgula por ponto (separador decimal)

  const numValue = parseFloat(cleanValue)

  return isNaN(numValue) ? null : numValue
}

/**
 * Converte string formatada em padrão brasileiro para string no padrão americano
 * @param {string} value - String no formato brasileiro (ex: "1.234,56")
 * @returns {string} String no formato americano ou string vazia se inválido
 */
window.parseBRToString = function (value) {
  const numValue = window.parseBRToNumber(value)
  return numValue !== null ? numValue.toString() : ''
}

/**
 * Aplica máscara de decimal brasileiro em um input
 * @param {HTMLInputElement} input - Elemento input
 * @param {number} decimals - Número de casas decimais permitidas
 */
window.applyDecimalMask = function (input, decimals = 2) {
  if (!input) return

  input.addEventListener('input', function (e) {
    let value = e.target.value

    // Remove tudo exceto números, vírgula e ponto
    value = value.replace(/[^\d.,]/g, '')

    // Substitui ponto por vírgula temporariamente
    value = value.replace(/\./g, ',')

    // Permite apenas uma vírgula
    const parts = value.split(',')
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('')
    }

    // Limita casas decimais
    if (parts.length === 2 && parts[1].length > decimals) {
      parts[1] = parts[1].substring(0, decimals)
      value = parts.join(',')
    }

    e.target.value = value
  })

  // Formata ao sair do campo
  input.addEventListener('blur', function (e) {
    const numValue = window.parseBRToNumber(e.target.value)
    if (numValue !== null) {
      e.target.value = window.formatDecimalBR(numValue, decimals)
    }
  })

  // Remove formatação ao focar (facilita edição)
  input.addEventListener('focus', function (e) {
    const numValue = window.parseBRToNumber(e.target.value)
    if (numValue !== null) {
      e.target.value = numValue.toString().replace('.', ',')
    }
  })
}

/**
 * Aplica máscara de moeda brasileira em um input
 * Apenas formata o valor (troca . por ,), sem alterar o número
 * @param {HTMLInputElement} input - Elemento input
 */
window.applyCurrencyMask = function (input) {
  if (!input) return

  input.addEventListener('input', function (e) {
    let value = e.target.value

    // Remove tudo exceto números, vírgula e ponto
    value = value.replace(/[^\d.,]/g, '')

    // Substitui ponto por vírgula (padrão brasileiro)
    value = value.replace(/\./g, ',')

    // Permite apenas uma vírgula (separador decimal)
    const parts = value.split(',')
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('')
    }

    // Limita a 2 casas decimais
    if (parts.length === 2 && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2)
      value = parts.join(',')
    }

    e.target.value = value
  })

  // Formata ao sair do campo (blur)
  input.addEventListener('blur', function (e) {
    const numValue = window.parseBRToNumber(e.target.value)
    console.log('🔍 [Currency Mask Blur] Input:', e.target.value, '| Parsed:', numValue)
    if (numValue !== null) {
      e.target.value = window.formatCurrencyBR(numValue, false)
      console.log('🔍 [Currency Mask Blur] Formatted:', e.target.value)
    }
  })
}

// DEBUG: Log inicial dos campos
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input[data-mask="currency"]').forEach(function (input) {
    console.log('🔍 [Currency Field Loaded]', input.name, '| Initial value:', input.value)
  })
})


/**
 * Inicializa máscaras automaticamente em inputs com data-mask
 * 
 * @example
 * <input type="text" data-mask="decimal" data-decimals="2">
 * <input type="text" data-mask="currency">
 */
document.addEventListener('DOMContentLoaded', function () {
  // Máscara de decimal
  document.querySelectorAll('input[data-mask="decimal"]').forEach(function (input) {
    const decimals = parseInt(input.getAttribute('data-decimals')) || 2
    window.applyDecimalMask(input, decimals)
  })

  // Máscara de moeda
  document.querySelectorAll('input[data-mask="currency"]').forEach(function (input) {
    window.applyCurrencyMask(input)
  })
})
