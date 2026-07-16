/**
 * Script global para formatação de timestamps com timezone do usuário
 * Este script processa todos os elementos com atributos data-timestamp
 * e data-timestamp-full e os formata com o timezone local do navegador
 */

(function() {
  'use strict';

  /**
   * Formata timestamps de horário (HH:mm)
   */
  function formatTimestamps() {
    document.querySelectorAll('[data-timestamp]').forEach(element => {
      const timestamp = element.getAttribute('data-timestamp')
      if (timestamp && timestamp !== 'null' && timestamp !== '') {
        try {
          const date = new Date(timestamp)
          if (!isNaN(date.getTime())) {
            element.textContent = date.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          } else {
            element.textContent = '--:--'
          }
        } catch (error) {
          console.error('Erro ao formatar timestamp:', error)
          element.textContent = '--:--'
        }
      }
    })
  }

  /**
   * Formata timestamps de data e hora completos (DD/MM/YYYY HH:mm)
   */
  function formatDateTimestamps() {
    document.querySelectorAll('[data-timestamp-full]').forEach(element => {
      const timestamp = element.getAttribute('data-timestamp-full')
      if (timestamp && timestamp !== 'null' && timestamp !== '') {
        try {
          const date = new Date(timestamp)
          if (!isNaN(date.getTime())) {
            element.textContent = date.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } else {
            element.textContent = '-'
          }
        } catch (error) {
          console.error('Erro ao formatar data timestamp:', error)
          element.textContent = '-'
        }
      }
    })
  }

  /**
   * Formata timestamps de data (DD/MM/YYYY)
   */
  function formatDateOnlyTimestamps() {
    document.querySelectorAll('[data-timestamp-date]').forEach(element => {
      const timestamp = element.getAttribute('data-timestamp-date')
      if (timestamp && timestamp !== 'null' && timestamp !== '') {
        try {
          const date = new Date(timestamp)
          if (!isNaN(date.getTime())) {
            element.textContent = date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          } else {
            element.textContent = '-'
          }
        } catch (error) {
          console.error('Erro ao formatar data:', error)
          element.textContent = '-'
        }
      }
    })
  }

  /**
   * Formata timestamps para inputs (value) com timezone do usuario
   * data-timestamp-input aceita: date | time | datetime
   */
  function formatTimestampInputs() {
    document.querySelectorAll('[data-timestamp-input]').forEach(element => {
      const mode = element.getAttribute('data-timestamp-input') || 'datetime'
      const timestamp = element.getAttribute('data-timestamp')

      if (!timestamp || timestamp === 'null' || timestamp === '') {
        return
      }

      try {
        const date = new Date(timestamp)
        if (isNaN(date.getTime())) {
          return
        }

        let formatted = ''
        if (mode === 'date') {
          formatted = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        } else if (mode === 'time') {
          formatted = date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        } else {
          formatted = date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }

        if ('value' in element) {
          element.value = formatted
        } else {
          element.textContent = formatted
        }
      } catch (error) {
        console.error('Erro ao formatar input de timestamp:', error)
      }
    })
  }

  /**
   * Formata timestamps com formato customizado
   * data-timestamp-format: date-long | date | time | datetime
   */
  function formatCustomTimestamps() {
    document.querySelectorAll('[data-timestamp-format]').forEach(element => {
      const format = element.getAttribute('data-timestamp-format') || 'datetime'
      const timestamp = element.getAttribute('data-timestamp')

      if (!timestamp || timestamp === 'null' || timestamp === '') {
        return
      }

      try {
        const date = new Date(timestamp)
        if (isNaN(date.getTime())) {
          return
        }

        let options
        if (format === 'date-long') {
          options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
          element.textContent = date.toLocaleDateString('pt-BR', options)
          return
        }

        if (format === 'date') {
          options = { day: '2-digit', month: '2-digit', year: 'numeric' }
          element.textContent = date.toLocaleDateString('pt-BR', options)
          return
        }

        if (format === 'time') {
          options = { hour: '2-digit', minute: '2-digit' }
          element.textContent = date.toLocaleTimeString('pt-BR', options)
          return
        }

        options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        element.textContent = date.toLocaleString('pt-BR', options)
      } catch (error) {
        console.error('Erro ao formatar timestamp customizado:', error)
      }
    })
  }

  /**
   * Processa todos os timestamps na página
   */
  function processAllTimestamps() {
    formatTimestamps()
    formatDateTimestamps()
    formatDateOnlyTimestamps()
    formatTimestampInputs()
    formatCustomTimestamps()
  }

  // Executar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processAllTimestamps)
  } else {
    processAllTimestamps()
  }

  // Criar um MutationObserver para detectar novos elementos adicionados dinamicamente
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (
              node.hasAttribute && (
                node.hasAttribute('data-timestamp') ||
                node.hasAttribute('data-timestamp-full') ||
                node.hasAttribute('data-timestamp-date') ||
                node.hasAttribute('data-timestamp-input') ||
                node.hasAttribute('data-timestamp-format')
              )
            ) {
              shouldProcess = true
            } else if (node.querySelector) {
              const hasTimestamps = 
                node.querySelector('[data-timestamp]') ||
                node.querySelector('[data-timestamp-full]') ||
                node.querySelector('[data-timestamp-date]') ||
                node.querySelector('[data-timestamp-input]') ||
                node.querySelector('[data-timestamp-format]')
              
              if (hasTimestamps) {
                shouldProcess = true
              }
            }
          }
        })
      }
    })
    
    if (shouldProcess) {
      processAllTimestamps()
    }
  })

  // Observar mudanças no DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // Disponibilizar funções globalmente para uso manual se necessário
  window.TimestampFormatter = {
    formatTimestamps,
    formatDateTimestamps,
    formatDateOnlyTimestamps,
    formatTimestampInputs,
    formatCustomTimestamps,
    processAll: processAllTimestamps
  }
})();
