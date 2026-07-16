/**
 * Form Validation and Formatting Utilities
 * Sistema Tavolo - Validação e formatação de formulários
 */

// Funções de formatação
export const formatters = {
  cnpj: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
    }
    return value
  },
  cpf: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4')
    }
    return value
  },
  cep: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d{3}).*/, '$1-$2')
    }
    return value
  },
  phone: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
    } else if (numbers.length === 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3')
    }
    return value
  },
  currency: (value) => {
    // Remove tudo exceto números e vírgula/ponto
    let numbers = value.replace(/[^\d.,]/g, '')
    // Substitui vírgula por ponto
    numbers = numbers.replace(',', '.')
    // Remove pontos extras (mantém apenas o último)
    const parts = numbers.split('.')
    if (parts.length > 2) {
      numbers = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
    }
    // Limita a 2 casas decimais
    const num = parseFloat(numbers)
    if (!isNaN(num)) {
      return num.toFixed(2).replace('.', ',')
    }
    return value
  },
  number: (value) => {
    return value.replace(/\D/g, '')
  }
}

// Funções de validação
export const validators = {
  cnpj: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length !== 14) return { valid: false, message: 'CNPJ deve ter 14 dígitos' }

    // Validação básica de CNPJ
    if (/^(\d)\1+$/.test(numbers)) return { valid: false, message: 'CNPJ inválido' }

    let size = numbers.length - 2
    let nums = numbers.substring(0, size)
    const digits = numbers.substring(size)
    let sum = 0
    let pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += nums.charAt(size - i) * pos--
      if (pos < 2) pos = 9
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result != digits.charAt(0)) return { valid: false, message: 'CNPJ inválido' }

    size = size + 1
    nums = numbers.substring(0, size)
    sum = 0
    pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += nums.charAt(size - i) * pos--
      if (pos < 2) pos = 9
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result != digits.charAt(1)) return { valid: false, message: 'CNPJ inválido' }

    return { valid: true, message: 'CNPJ válido' }
  },
  cpf: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers || numbers.length === 0) return { valid: true, message: '' } // Campo opcional
    if (numbers.length !== 11) return { valid: false, message: 'CPF deve ter 11 dígitos' }

    // Validação básica de CPF
    if (/^(\d)\1+$/.test(numbers)) return { valid: false, message: 'CPF inválido' }

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit === 10 || digit === 11) digit = 0
    if (digit !== parseInt(numbers.charAt(9))) return { valid: false, message: 'CPF inválido' }

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit === 10 || digit === 11) digit = 0
    if (digit !== parseInt(numbers.charAt(10))) return { valid: false, message: 'CPF inválido' }

    return { valid: true, message: 'CPF válido' }
  },
  cep: (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length !== 8) return { valid: false, message: 'CEP deve ter 8 dígitos' }
    return { valid: true, message: 'CEP válido' }
  },
  email: (value) => {
    if (!value) return { valid: false, message: 'Email é obrigatório' }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(value)) return { valid: false, message: 'Email inválido' }
    return { valid: true, message: 'Email válido' }
  },
  emailOptional: (value) => {
    if (!value) return { valid: true, message: '' }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(value)) return { valid: false, message: 'Email inválido' }
    return { valid: true, message: 'Email válido' }
  },
  phone: (value) => {
    if (!value) return { valid: true, message: '' } // Campo opcional
    const numbers = value.replace(/\D/g, '')
    if (numbers.length !== 10 && numbers.length !== 11) {
      return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos' }
    }
    return { valid: true, message: 'Telefone válido' }
  },
  required: (value) => {
    if (!value || value.trim() === '') {
      return { valid: false, message: 'Campo obrigatório' }
    }
    return { valid: true, message: '' }
  },
  password: (value) => {
    if (!value) return { valid: false, message: 'Senha é obrigatória' }
    if (value.length < 6) return { valid: false, message: 'Senha deve ter no mínimo 6 caracteres' }
    return { valid: true, message: 'Senha válida' }
  },
  passwordConfirmation: (value, originalPassword) => {
    if (!value) return { valid: false, message: 'Confirmação de senha é obrigatória' }
    if (value !== originalPassword) return { valid: false, message: 'As senhas não coincidem' }
    return { valid: true, message: 'Senhas coincidem' }
  },
  currency: (value) => {
    if (!value) return { valid: false, message: 'Valor é obrigatório' }
    const numbers = value.replace(/[^\d.,]/g, '').replace(',', '.')
    const num = parseFloat(numbers)
    if (isNaN(num) || num < 0) return { valid: false, message: 'Valor inválido' }
    return { valid: true, message: 'Valor válido' }
  },
  currencyOptional: (value) => {
    if (!value) return { valid: true, message: '' }
    const numbers = value.replace(/[^\d.,]/g, '').replace(',', '.')
    const num = parseFloat(numbers)
    if (isNaN(num) || num < 0) return { valid: false, message: 'Valor inválido' }
    return { valid: true, message: 'Valor válido' }
  },
  number: (value) => {
    if (!value) return { valid: false, message: 'Número é obrigatório' }
    const num = parseInt(value)
    if (isNaN(num)) return { valid: false, message: 'Número inválido' }
    return { valid: true, message: 'Número válido' }
  },
  numberOptional: (value) => {
    if (!value) return { valid: true, message: '' }
    const num = parseInt(value)
    if (isNaN(num)) return { valid: false, message: 'Número inválido' }
    return { valid: true, message: 'Número válido' }
  },
  minLength: (value, min) => {
    if (!value || value.length < min) {
      return { valid: false, message: `Deve ter no mínimo ${min} caracteres` }
    }
    return { valid: true, message: '' }
  },
  url: (value) => {
    if (!value) return { valid: true, message: '' }
    try {
      new URL(value)
      return { valid: true, message: 'URL válida' }
    } catch {
      return { valid: false, message: 'URL inválida' }
    }
  }
}

// Função para mostrar feedback visual
export function showFeedback(input, validation) {
  // Remove feedback anterior
  const existingFeedback = input.parentElement.querySelector('.field-feedback')
  if (existingFeedback) {
    existingFeedback.remove()
  }

  // Atualiza classes do input
  input.classList.remove('border-red-500', 'border-green-500', 'focus:ring-red-500', 'focus:ring-green-500')

  if (validation.valid) {
    input.classList.add('border-green-500', 'focus:ring-green-500')
  } else if (validation.message) {
    input.classList.add('border-red-500', 'focus:ring-red-500')
  }

  // Adiciona mensagem de feedback se houver
  if (validation.message) {
    const feedback = document.createElement('div')
    feedback.className = `field-feedback text-xs mt-1 ${validation.valid ? 'text-green-600' : 'text-red-600'}`
    feedback.textContent = validation.message
    input.parentElement.appendChild(feedback)
  }
}

// Buscar endereço por CEP
export async function buscarCep(cep, options = {}) {
  const numbers = cep.replace(/\D/g, '')
  if (numbers.length !== 8) return

  const {
    cepInput,
    addressInput,
    neighborhoodInput,
    cityInput,
    stateInput
  } = options

  try {
    const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`)
    const data = await response.json()

    if (!data.erro) {
      if (data.logradouro && addressInput) addressInput.value = data.logradouro
      if (data.bairro && neighborhoodInput) neighborhoodInput.value = data.bairro
      if (data.localidade && cityInput) cityInput.value = data.localidade
      if (data.uf && stateInput) stateInput.value = data.uf

      if (cepInput) {
        showFeedback(cepInput, { valid: true, message: 'CEP encontrado' })
      }
      
      // Foca no próximo campo disponível
      if (addressInput && !data.logradouro) {
        addressInput.focus()
      } else if (neighborhoodInput && !data.bairro) {
        neighborhoodInput.focus()
      } else {
        const addressNumberInput = document.querySelector('[name="address_number"], [name="addressNumber"]')
        if (addressNumberInput) addressNumberInput.focus()
      }
    } else {
      if (cepInput) {
        showFeedback(cepInput, { valid: false, message: 'CEP não encontrado' })
      }
    }
  } catch (error) {
    if (cepInput) {
      showFeedback(cepInput, { valid: false, message: 'Erro ao buscar CEP' })
    }
  }
}

// Configuração de validações para um campo
export function setupFieldValidation(fieldId, validationType, formatType = null, options = {}) {
  const field = document.getElementById(fieldId)
  if (!field) return

  // Aplicar formatação on blur
  if (formatType && formatters[formatType]) {
    field.addEventListener('blur', function () {
      if (this.value) {
        this.value = formatters[formatType](this.value)
      }
    })
  }

  // Aplicar validação on blur
  if (validationType) {
    field.addEventListener('blur', function () {
      let validation
      
      if (typeof validationType === 'function') {
        validation = validationType(this.value, options)
      } else if (validators[validationType]) {
        validation = validators[validationType](this.value, options)
      } else {
        return
      }

      showFeedback(this, validation)

      // CEP: buscar endereço automaticamente
      if (formatType === 'cep' && validation.valid && options.cepOptions) {
        buscarCep(this.value, {
          cepInput: this,
          ...options.cepOptions
        })
      }
    })
  }
}

// Inicialização rápida de validações comuns
export function initCommonValidations() {
  // CNPJ
  const cnpjFields = document.querySelectorAll('[data-validate="cnpj"]')
  cnpjFields.forEach(field => {
    setupFieldValidation(field.id, 'cnpj', 'cnpj')
  })

  // CPF
  const cpfFields = document.querySelectorAll('[data-validate="cpf"]')
  cpfFields.forEach(field => {
    setupFieldValidation(field.id, 'cpf', 'cpf')
  })

  // CEP
  const cepFields = document.querySelectorAll('[data-validate="cep"]')
  cepFields.forEach(field => {
    const cepOptions = {
      addressInput: document.getElementById(field.dataset.addressField || 'address'),
      neighborhoodInput: document.getElementById(field.dataset.neighborhoodField || 'neighborhood'),
      cityInput: document.getElementById(field.dataset.cityField || 'city'),
      stateInput: document.getElementById(field.dataset.stateField || 'state')
    }
    
    setupFieldValidation(field.id, 'cep', 'cep', { cepOptions })
  })

  // Telefones
  const phoneFields = document.querySelectorAll('[data-validate="phone"]')
  phoneFields.forEach(field => {
    setupFieldValidation(field.id, 'phone', 'phone')
  })

  // Emails
  const emailFields = document.querySelectorAll('[data-validate="email"]')
  emailFields.forEach(field => {
    const isRequired = field.hasAttribute('required')
    setupFieldValidation(field.id, isRequired ? 'email' : 'emailOptional')
  })

  // Campos obrigatórios
  const requiredFields = document.querySelectorAll('[data-validate="required"]')
  requiredFields.forEach(field => {
    setupFieldValidation(field.id, 'required')
  })

  // Moeda
  const currencyFields = document.querySelectorAll('[data-validate="currency"]')
  currencyFields.forEach(field => {
    const isRequired = field.hasAttribute('required')
    setupFieldValidation(field.id, isRequired ? 'currency' : 'currencyOptional', 'currency')
  })

  // URLs
  const urlFields = document.querySelectorAll('[data-validate="url"]')
  urlFields.forEach(field => {
    setupFieldValidation(field.id, 'url')
  })
}
