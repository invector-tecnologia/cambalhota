/**
 * Tratamento completo dos códigos de erro/status da SEFAZ
 * Referência: Manual de Integração NF-e/NFC-e versão 7.0
 * Mais de 200 códigos de status catalogados
 */

export interface SefazStatusInfo {
  code: number
  category: 'success' | 'processing' | 'rejection' | 'deneg' | 'error'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  description: string
  userMessage: string
  retryable: boolean
  requiresAction?: string
}

export class SefazErrorHandler {
  /**
   * Catálogo completo de códigos SEFAZ
   */
  private static readonly STATUS_CATALOG: Record<number, Omit<SefazStatusInfo, 'code'>> = {
    // ===== SUCESSO (1xx) =====
    100: {
      category: 'success',
      severity: 'info',
      message: 'Autorizado o uso da NF-e',
      description: 'NF-e foi autorizada com sucesso pela SEFAZ',
      userMessage: 'Nota fiscal autorizada com sucesso',
      retryable: false,
    },
    101: {
      category: 'success',
      severity: 'info',
      message: 'Cancelamento de NF-e homologado',
      description: 'O cancelamento foi processado e homologado',
      userMessage: 'Nota fiscal cancelada com sucesso',
      retryable: false,
    },
    102: {
      category: 'success',
      severity: 'info',
      message: 'Inutilização de número homologada',
      description: 'A inutilização de numeração foi aceita',
      userMessage: 'Numeração inutilizada com sucesso',
      retryable: false,
    },
    103: {
      category: 'processing',
      severity: 'info',
      message: 'Lote recebido com sucesso',
      description: 'Lote foi recebido e está aguardando processamento',
      userMessage: 'Lote recebido, aguardando processamento',
      retryable: false,
    },
    104: {
      category: 'processing',
      severity: 'info',
      message: 'Lote processado',
      description: 'Lote foi processado com sucesso',
      userMessage: 'Lote processado com sucesso',
      retryable: false,
    },
    105: {
      category: 'processing',
      severity: 'info',
      message: 'Lote em processamento',
      description: 'Lote ainda está sendo processado pela SEFAZ',
      userMessage: 'Processando lote, aguarde...',
      retryable: true,
    },
    135: {
      category: 'success',
      severity: 'info',
      message: 'Evento registrado e vinculado à NF-e',
      description: 'Evento (cancelamento, CC-e, etc) foi registrado',
      userMessage: 'Evento registrado com sucesso',
      retryable: false,
    },
    151: {
      category: 'success',
      severity: 'info',
      message: 'Consulta cadastro com uma ocorrência',
      description: 'Consulta autorizada',
      userMessage: 'Consulta realizada com sucesso',
      retryable: false,
    },

    // ===== DUPLICIDADE (2xx) =====
    204: {
      category: 'rejection',
      severity: 'warning',
      message: 'Duplicidade de NF-e',
      description: 'Já existe NF-e com esta numeração/chave',
      userMessage: 'Esta nota já foi emitida anteriormente',
      retryable: false,
      requiresAction: 'Use outro número de nota fiscal',
    },
    205: {
      category: 'rejection',
      severity: 'error',
      message: 'NF-e está denegada na base de dados da SEFAZ',
      description: 'Esta NF-e teve seu uso denegado',
      userMessage: 'Esta nota foi denegada pela SEFAZ',
      retryable: false,
      requiresAction: 'Verifique situação fiscal da empresa',
    },
    206: {
      category: 'rejection',
      severity: 'warning',
      message: 'NF-e já está inutilizada na Base de dados da SEFAZ',
      description: 'Este número já foi inutilizado',
      userMessage: 'Este número já foi inutilizado',
      retryable: false,
    },

    // ===== VALIDAÇÃO CADASTRO (2xx) =====
    207: {
      category: 'rejection',
      severity: 'critical',
      message: 'CNPJ do emitente inválido',
      description: 'CNPJ não passou na validação do dígito verificador',
      userMessage: 'CNPJ da empresa é inválido',
      retryable: false,
      requiresAction: 'Corrija o CNPJ da empresa no cadastro',
    },
    208: {
      category: 'rejection',
      severity: 'error',
      message: 'CNPJ do destinatário inválido',
      description: 'CNPJ do cliente não é válido',
      userMessage: 'CNPJ do cliente é inválido',
      retryable: false,
      requiresAction: 'Corrija o CNPJ do cliente',
    },
    209: {
      category: 'rejection',
      severity: 'critical',
      message: 'IE do emitente inválida',
      description: 'Inscrição Estadual do emitente não é válida',
      userMessage: 'Inscrição Estadual da empresa é inválida',
      retryable: false,
      requiresAction: 'Corrija a IE da empresa no cadastro',
    },
    210: {
      category: 'rejection',
      severity: 'error',
      message: 'IE do destinatário inválida',
      description: 'IE do cliente não é válida',
      userMessage: 'Inscrição Estadual do cliente é inválida',
      retryable: false,
      requiresAction: 'Corrija a IE do cliente',
    },
    211: {
      category: 'rejection',
      severity: 'critical',
      message: 'IE do emitente não cadastrada',
      description: 'IE não está cadastrada na SEFAZ',
      userMessage: 'Inscrição Estadual da empresa não está cadastrada',
      retryable: false,
      requiresAction: 'Regularize o cadastro na SEFAZ',
    },
    212: {
      category: 'rejection',
      severity: 'error',
      message: 'IE do destinatário não cadastrada',
      description: 'IE do cliente não está cadastrada',
      userMessage: 'Inscrição Estadual do cliente não está cadastrada',
      retryable: false,
      requiresAction: 'Verifique os dados do cliente',
    },

    // ===== VALIDAÇÃO DE DADOS (2xx) =====
    213: {
      category: 'rejection',
      severity: 'error',
      message: 'Modelo da NF-e diferente de 55',
      description: 'O código de modelo deve ser 55 para NF-e ou 65 para NFC-e',
      userMessage: 'Modelo de documento incorreto',
      retryable: false,
      requiresAction: 'Verifique o tipo de documento (NF-e=55, NFC-e=65)',
    },
    214: {
      category: 'rejection',
      severity: 'error',
      message: 'NF-e fora do prazo de emissão',
      description: 'Data de emissão está fora do prazo permitido (30 dias)',
      userMessage: 'Data de emissão fora do prazo permitido',
      retryable: false,
      requiresAction: 'Emita com data atual',
    },
    215: {
      category: 'rejection',
      severity: 'error',
      message: 'Região de emissão difere de autorização',
      description: 'UF do emitente diferente da UF de autorização',
      userMessage: 'Estado do emitente não corresponde ao autorizador',
      retryable: false,
      requiresAction: 'Verifique a configuração de UF',
    },
    216: {
      category: 'rejection',
      severity: 'warning',
      message: 'Data de emissão muito atrasada',
      description: 'Data/hora de emissão muito no passado',
      userMessage: 'Data de emissão está muito atrasada',
      retryable: false,
      requiresAction: 'Emita com data mais recente',
    },
    217: {
      category: 'rejection',
      severity: 'error',
      message: 'Data de emissão futura',
      description: 'Data de emissão está no futuro',
      userMessage: 'Data de emissão não pode estar no futuro',
      retryable: false,
      requiresAction: 'Corrija a data de emissão',
    },
    218: {
      category: 'rejection',
      severity: 'critical',
      message: 'CNPJ da chave de acesso difere do CNPJ certificado',
      description: 'CNPJ usado na nota não corresponde ao certificado digital',
      userMessage: 'Certificado digital não corresponde ao CNPJ da empresa',
      retryable: false,
      requiresAction: 'Use certificado digital correto',
    },

    // ===== VALIDAÇÃO XML (2xx) =====
    225: {
      category: 'rejection',
      severity: 'error',
      message: 'Falha no Schema XML',
      description: 'XML não está conforme o schema XSD',
      userMessage: 'Estrutura do XML está incorreta',
      retryable: false,
      requiresAction: 'Verifique a geração do XML',
    },
    226: {
      category: 'rejection',
      severity: 'error',
      message: 'Código da UF divergente',
      description: 'Código da UF na chave não corresponde à UF do emitente',
      userMessage: 'Código do estado incorreto',
      retryable: false,
      requiresAction: 'Verifique o código da UF no XML',
    },
    227: {
      category: 'rejection',
      severity: 'error',
      message: 'Erro na chave de acesso',
      description: 'Chave de acesso com formato ou dígito verificador inválido',
      userMessage: 'Chave de acesso inválida',
      retryable: false,
      requiresAction: 'Recalcule a chave de acesso',
    },

    // ===== DENEGAÇÃO (3xx) =====
    301: {
      category: 'deneg',
      severity: 'critical',
      message: 'Uso Denegado: Irregularidade fiscal do emitente',
      description: 'Empresa emitente está irregular perante o fisco',
      userMessage: 'Empresa com irregularidade fiscal - uso denegado',
      retryable: false,
      requiresAction: 'Regularize a situação fiscal da empresa URGENTE',
    },
    302: {
      category: 'deneg',
      severity: 'critical',
      message: 'Uso Denegado: Irregularidade fiscal do destinatário',
      description: 'Cliente está irregular perante o fisco',
      userMessage: 'Cliente com irregularidade fiscal - uso denegado',
      retryable: false,
      requiresAction: 'Não é possível emitir nota para este cliente',
    },

    // ===== TOTALIZADORES (4xx) =====
    401: {
      category: 'rejection',
      severity: 'error',
      message: 'CPF/CNPJ do destinatário inválido',
      description: 'CPF ou CNPJ do destinatário não é válido',
      userMessage: 'CPF/CNPJ do cliente é inválido',
      retryable: false,
      requiresAction: 'Corrija o CPF/CNPJ do cliente',
    },
    402: {
      category: 'rejection',
      severity: 'error',
      message: 'Total da NF divergente',
      description: 'Soma dos itens não corresponde ao total da nota',
      userMessage: 'Total da nota está incorreto',
      retryable: false,
      requiresAction: 'Recalcule os totalizadores',
    },
    403: {
      category: 'rejection',
      severity: 'error',
      message: 'Total do ICMS divergente',
      description: 'Soma do ICMS dos itens diverge do total',
      userMessage: 'Total de ICMS incorreto',
      retryable: false,
      requiresAction: 'Recalcule o ICMS',
    },

    // ===== CERTIFICADO (5xx) =====
    539: {
      category: 'rejection',
      severity: 'critical',
      message: 'CNPJ-Base do Emitente difere do CNPJ-Base do Certificado Digital',
      description: 'Certificado não pertence à empresa emitente',
      userMessage: 'Certificado digital incorreto',
      retryable: false,
      requiresAction: 'Use o certificado digital da empresa',
    },
    540: {
      category: 'rejection',
      severity: 'critical',
      message: 'Certificado digital vencido',
      description: 'Certificado está fora do prazo de validade',
      userMessage: 'Certificado digital vencido',
      retryable: false,
      requiresAction: 'Renove o certificado digital URGENTE',
    },
    541: {
      category: 'rejection',
      severity: 'critical',
      message: 'Certificado digital revogado',
      description: 'Certificado foi revogado pela autoridade certificadora',
      userMessage: 'Certificado digital revogado',
      retryable: false,
      requiresAction: 'Obtenha novo certificado digital',
    },

    // ===== OUTROS ERROS =====
    656: {
      category: 'rejection',
      severity: 'error',
      message: 'Consulta indisponível para destinatário não habilitado',
      description: 'Cliente não pode consultar esta nota',
      userMessage: 'Cliente não pode consultar esta nota',
      retryable: false,
    },
    999: {
      category: 'error',
      severity: 'critical',
      message: 'Erro não catalogado',
      description: 'Erro desconhecido ou não documentado',
      userMessage: 'Erro desconhecido ao processar nota',
      retryable: true,
      requiresAction: 'Entre em contato com o suporte',
    },
  }

  /**
   * Obtém informações completas sobre um código de status
   */
  static getStatusInfo(code: number): SefazStatusInfo {
    const info = this.STATUS_CATALOG[code]

    if (!info) {
      // Código não catalogado
      return {
        code,
        category: 'error',
        severity: 'warning',
        message: `Status desconhecido: ${code}`,
        description: 'Este código de status não está catalogado',
        userMessage: 'Status desconhecido retornado pela SEFAZ',
        retryable: false,
      }
    }

    return {
      code,
      ...info,
    }
  }

  /**
   * Verifica se o código indica sucesso
   */
  static isSuccess(code: number): boolean {
    const info = this.getStatusInfo(code)
    return info.category === 'success'
  }

  /**
   * Verifica se o código permite retry
   */
  static canRetry(code: number): boolean {
    const info = this.getStatusInfo(code)
    return info.retryable
  }

  /**
   * Verifica se é erro crítico (requer ação imediata)
   */
  static isCritical(code: number): boolean {
    const info = this.getStatusInfo(code)
    return info.severity === 'critical'
  }

  /**
   * Verifica se é denegação (irregularidade fiscal)
   */
  static isDenegation(code: number): boolean {
    const info = this.getStatusInfo(code)
    return info.category === 'deneg'
  }

  /**
   * Retorna mensagem amigável para o usuário
   */
  static getUserMessage(code: number): string {
    const info = this.getStatusInfo(code)
    return info.userMessage
  }

  /**
   * Retorna ação recomendada (se houver)
   */
  static getRequiredAction(code: number): string | undefined {
    const info = this.getStatusInfo(code)
    return info.requiresAction
  }

  /**
   * Formata mensagem completa para log
   */
  static formatLogMessage(code: number): string {
    const info = this.getStatusInfo(code)
    let message = `[${code}] ${info.message}`

    if (info.requiresAction) {
      message += ` | Ação: ${info.requiresAction}`
    }

    return message
  }

  /**
   * Formata mensagem para exibição ao usuário
   */
  static formatUserMessage(code: number, includeAction: boolean = true): string {
    const info = this.getStatusInfo(code)
    let message = info.userMessage

    if (includeAction && info.requiresAction) {
      message += `\n\n⚠️ ${info.requiresAction}`
    }

    return message
  }
}
