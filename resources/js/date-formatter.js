/**
 * Formatador de datas com timezone do usuário
 * Todas as datas devem ser passadas como ISO strings ou timestamps do servidor
 * e serão convertidas para o timezone local do navegador do usuário
 */

/**
 * Formata uma data no formato completo (data e hora)
 * @param {string|Date} date - Data em formato ISO ou objeto Date
 * @param {object} options - Opções de formatação
 * @returns {string} Data formatada
 */
export function formatDateTime(date, options = {}) {
  if (!date) return '-'
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString('pt-BR', defaultOptions)
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

/**
 * Formata apenas o horário
 * @param {string|Date} date - Data em formato ISO ou objeto Date
 * @param {object} options - Opções de formatação
 * @returns {string} Horário formatado
 */
export function formatTime(date, options = {}) {
  if (!date) return '--:--'
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('pt-BR', defaultOptions)
  } catch (error) {
    console.error('Erro ao formatar horário:', error)
    return '--:--'
  }
}

/**
 * Formata apenas a data
 * @param {string|Date} date - Data em formato ISO ou objeto Date
 * @param {object} options - Opções de formatação
 * @returns {string} Data formatada
 */
export function formatDate(date, options = {}) {
  if (!date) return '-'
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR', defaultOptions)
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

/**
 * Formata data e hora com segundos
 * @param {string|Date} date - Data em formato ISO ou objeto Date
 * @returns {string} Data e hora formatadas com segundos
 */
export function formatDateTimeWithSeconds(date) {
  return formatDateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Formata horário com segundos
 * @param {string|Date} date - Data em formato ISO ou objeto Date
 * @returns {string} Horário formatado com segundos
 */
export function formatTimeWithSeconds(date) {
  return formatTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Retorna a data/hora atual no timezone do usuário
 * @returns {Date} Data atual
 */
export function now() {
  return new Date()
}

/**
 * Verifica se uma data é de hoje
 * @param {string|Date} date - Data para verificar
 * @returns {boolean} True se a data é hoje
 */
export function isToday(date) {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear()
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error)
    return false
  }
}

/**
 * Formata data relativa (ex: "hoje", "ontem", "há 2 dias")
 * @param {string|Date} date - Data para formatar
 * @returns {string} Data formatada de forma relativa
 */
export function formatRelativeDate(date) {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (isToday(dateObj)) {
      return 'Hoje às ' + formatTime(dateObj)
    }
    
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Ontem às ' + formatTime(dateObj)
    }
    
    const diffTime = Math.abs(today - dateObj)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) {
      return `Há ${diffDays} dias às ` + formatTime(dateObj)
    }
    
    return formatDateTime(dateObj)
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error)
    return '-'
  }
}

// Disponibilizar globalmente no window
if (typeof window !== 'undefined') {
  window.DateFormatter = {
    formatDateTime,
    formatTime,
    formatDate,
    formatDateTimeWithSeconds,
    formatTimeWithSeconds,
    now,
    isToday,
    formatRelativeDate
  }
}
