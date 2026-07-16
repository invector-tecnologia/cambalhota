import { XMLParser } from 'fast-xml-parser'

/**
 * Resultado da validação de XML
 */
export interface XMLValidationResult {
  isValid: boolean
  wellFormed: boolean
  isSigned: boolean
  hasMandatoryFields: boolean
  signatureValid: boolean
  errors: ValidationError[]
  warnings: string[]
  details: {
    xmlVersion?: string
    encoding?: string
    rootElement?: string
    signatureElements?: number
    nfeNumber?: string
    accessKey?: string
  }
}

export interface ValidationError {
  code: string
  message: string
  severity: 'critical' | 'error' | 'warning'
}

/**
 * Validador robusto de XML para NFC-e
 * Verifica bem-formação, assinatura digital e campos obrigatórios
 */
export default class FiscalXMLValidator {
  private xmlParser: XMLParser

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      isArray: (name) => name === 'det', // det (itens) podem ser múltiplos
    })
  }

  /**
   * Valida XML gerado antes da assinatura
   * Verifica: bem-formação, tags obrigatórias, valores válidos
   */
  validateUnsignedXML(xmlContent: string): XMLValidationResult {
    const result: XMLValidationResult = {
      isValid: true,
      wellFormed: false,
      isSigned: false,
      hasMandatoryFields: false,
      signatureValid: false,
      errors: [],
      warnings: [],
      details: {},
    }

    try {
      // 1. Valida bem-formação
      result.wellFormed = this.isWellFormed(xmlContent)
      if (!result.wellFormed) {
        result.errors.push({
          code: 'MALFORMED_XML',
          message: 'XML não é bem-formado. Verifique sintaxe e tags fechadas.',
          severity: 'critical',
        })
        result.isValid = false
        return result
      }

      // 2. Parse XML para validação de conteúdo
      const parsed = this.xmlParser.parse(xmlContent)

      // 3. Extrai informações do XML
      const nfe = parsed.NFe || parsed.nfe
      if (!nfe) {
        result.errors.push({
          code: 'MISSING_NFE_ROOT',
          message: 'Elemento raiz <NFe> não encontrado',
          severity: 'critical',
        })
        result.isValid = false
        return result
      }

      const infNFe = nfe.infNFe
      if (!infNFe) {
        result.errors.push({
          code: 'MISSING_INFNFE',
          message: 'Elemento <infNFe> obrigatório não encontrado',
          severity: 'critical',
        })
        result.isValid = false
        return result
      }

      // 4. Extrai metadados
      result.details.rootElement = 'NFe'
      result.details.xmlVersion = this.extractXMLVersion(xmlContent)
      result.details.encoding = this.extractEncoding(xmlContent)

      // Obtém o número da nota
      const nfeId = infNFe['@_Id'] || ''
      if (nfeId.match(/NFe(\d{9})/)) {
        result.details.nfeNumber = nfeId.match(/NFe(\d{9})/)![1]
      }

      // 5. Valida campos obrigatórios mínimos
      const mandatoryValidation = this.validateMandatoryFields(infNFe)
      result.hasMandatoryFields = mandatoryValidation.isValid
      result.errors.push(...mandatoryValidation.errors)
      result.warnings.push(...mandatoryValidation.warnings)

      // 6. Valida estrutura de itens
      const itemsValidation = this.validateItems(infNFe)
      result.errors.push(...itemsValidation.errors)
      result.warnings.push(...itemsValidation.warnings)

      // 7. Valida totalizadores (valores)
      const totalsValidation = this.validateTotals(infNFe)
      result.errors.push(...totalsValidation.errors)
      result.warnings.push(...totalsValidation.warnings)

      // 8. Validar emitente/endereco
      const emitterValidation = this.validateEmitter(infNFe)
      result.errors.push(...emitterValidation.errors)

      result.isValid =
        result.wellFormed &&
        result.hasMandatoryFields &&
        result.errors.filter((e) => e.severity === 'critical').length === 0

      return result
    } catch (error) {
      result.wellFormed = false
      result.isValid = false
      result.errors.push({
        code: 'PARSE_ERROR',
        message: `Erro ao fazer parse do XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'critical',
      })
      return result
    }
  }

  /**
   * Valida XML assinado
   * Verifica: bem-formação, assinatura presente, tags de assinatura válidas
   */
  validateSignedXML(xmlContent: string): XMLValidationResult {
    const result = this.validateUnsignedXML(xmlContent)

    try {
      // 1. Verifica se tem assinatura
      const hasSignature = xmlContent.includes('<Signature') && xmlContent.includes('</Signature>')

      if (!hasSignature) {
        result.isSigned = false
        result.signatureValid = false
        result.errors.push({
          code: 'MISSING_SIGNATURE',
          message: 'XML não possui bloco <Signature>. Execute assinatura antes de transmitir.',
          severity: 'critical',
        })
        result.isValid = false
        return result
      }

      result.isSigned = true

      // 2. Valida estrutura da assinatura
      const signatureValidation = this.validateSignatureStructure(xmlContent)
      result.errors.push(...signatureValidation.errors)
      result.warnings.push(...signatureValidation.warnings)

      result.signatureValid = signatureValidation.isValid
      result.details.signatureElements = signatureValidation.elementCount

      // 3. Valida que NFe não está duplicada
      const nfeCount = (xmlContent.match(/<NFe>/g) || []).length
      if (nfeCount !== 1) {
        result.warnings.push(
          `XML contém ${nfeCount} elemento(s) NFe. Esperado: 1. Isso pode causar erro na SEFAZ.`
        )
      }

      result.isValid =
        result.wellFormed &&
        result.isSigned &&
        result.signatureValid &&
        result.errors.filter((e) => e.severity === 'critical').length === 0

      return result
    } catch (error) {
      result.isValid = false
      result.errors.push({
        code: 'SIGNATURE_VALIDATION_ERROR',
        message: `Erro ao validar assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'critical',
      })
      return result
    }
  }

  /**
   * Verifica se XML é bem-formado (sintaxe válida)
   */
  private isWellFormed(xmlContent: string): boolean {
    try {
      // Verifica tags básicas
      if (!xmlContent.includes('</NFe>') && !xmlContent.includes('</nfe>')) {
        return false
      }

      // Tenta fazer parse básico
      this.xmlParser.parse(xmlContent)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extrai versão XML da declaração
   */
  private extractXMLVersion(xmlContent: string): string | undefined {
    const match = xmlContent.match(/version="([^"]+)"/)
    return match?.[1]
  }

  /**
   * Extrai encoding da declaração
   */
  private extractEncoding(xmlContent: string): string | undefined {
    const match = xmlContent.match(/encoding="([^"]+)"/)
    return match?.[1]
  }

  /**
   * Valida campos obrigatórios mínimos
   */
  private validateMandatoryFields(infNFe: any): {
    isValid: boolean
    errors: ValidationError[]
    warnings: string[]
  } {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    try {
      const ide = infNFe.ide
      const emit = infNFe.emit
      const dest = infNFe.dest
      const det = infNFe.det
      const total = infNFe.total

      // Valida ide (identificação)
      if (!ide) {
        errors.push({
          code: 'MISSING_IDE',
          message: '<ide> (Identificação da NF-e) é obrigatório',
          severity: 'critical',
        })
      } else {
        if (!ide.cUF) {
          errors.push({
            code: 'MISSING_CUF',
            message: '<ide><cUF> (código UF) é obrigatório',
            severity: 'critical',
          })
        }
        if (!ide.cNF) {
          errors.push({
            code: 'MISSING_CNF',
            message: '<ide><cNF> (código numérico da NF) é obrigatório',
            severity: 'critical',
          })
        }
        if (!ide.assinaturaQrCode) {
          warnings.push('Campo opcional ausente: <ide><assinaturaQrCode>')
        }
        if (!ide.dhEmi) {
          errors.push({
            code: 'MISSING_DHEMI',
            message: '<ide><dhEmi> (data/hora de emissão) é obrigatório',
            severity: 'critical',
          })
        }
      }

      // Valida emit (emitente)
      if (!emit) {
        errors.push({
          code: 'MISSING_EMIT',
          message: '<emit> (Emitente) é obrigatório',
          severity: 'critical',
        })
      } else {
        if (!emit.CNPJ && !emit.CPF) {
          errors.push({
            code: 'MISSING_CNPJ_CPF',
            message: '<emit> deve conter <CNPJ> ou <CPF>',
            severity: 'critical',
          })
        }
        if (!emit.xNome) {
          errors.push({
            code: 'MISSING_XNOME_EMIT',
            message: '<emit><xNome> (razão social) é obrigatório',
            severity: 'critical',
          })
        }
        if (!emit.IE) {
          errors.push({
            code: 'MISSING_IE',
            message: '<emit><IE> (Inscrição Estadual) é obrigatório',
            severity: 'critical',
          })
        }
      }

      // Valida dest (destinatário)
      if (!dest) {
        warnings.push('Campo opcional ausente: <dest> (Destinatário)')
      } else if (!dest.CNPJ && !dest.CPF) {
        warnings.push('<dest> sem <CNPJ>/<CPF> pode causar rejeicao em alguns cenarios')
      }

      // Valida det (itens)
      if (!det || (Array.isArray(det) && det.length === 0) || (!Array.isArray(det) && !det.prod)) {
        errors.push({
          code: 'MISSING_DET',
          message: '<det> (Itens) deve conter pelo menos um item',
          severity: 'critical',
        })
      }

      // Valida total
      if (!total) {
        errors.push({
          code: 'MISSING_TOTAL',
          message: '<total> (Totalizadores) é obrigatório',
          severity: 'critical',
        })
      } else {
        if (!total.ICMSTot) {
          errors.push({
            code: 'MISSING_ICMS_TOT',
            message: '<total><ICMSTot> é obrigatório',
            severity: 'critical',
          })
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      }
    } catch (error) {
      errors.push({
        code: 'MANDATORY_VALIDATION_ERROR',
        message: `Erro ao validar campos obrigatórios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'critical',
      })
      return { isValid: false, errors, warnings }
    }
  }

  /**
   * Valida itens da nota
   */
  private validateItems(infNFe: any): { errors: ValidationError[]; warnings: string[] } {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    try {
      const det = infNFe.det
      if (!det) return { errors, warnings }

      const detArray = Array.isArray(det) ? det : [det]

      if (detArray.length === 0) {
        errors.push({
          code: 'NO_ITEMS',
          message: 'Nenhum item encontrado na nota',
          severity: 'critical',
        })
        return { errors, warnings }
      }

      detArray.forEach((item, index) => {
        const prod = item.prod
        if (!prod) {
          errors.push({
            code: `MISSING_PROD_${index}`,
            message: `Item ${index + 1}: <prod> é obrigatório`,
            severity: 'critical',
          })
          return
        }

        if (!prod.cProd && prod.cProd !== '0') {
          errors.push({
            code: `MISSING_CODE_${index}`,
            message: `Item ${index + 1}: <prod><cProd> é obrigatório`,
            severity: 'critical',
          })
        }

        if (!prod.xProd) {
          errors.push({
            code: `MISSING_XPROD_${index}`,
            message: `Item ${index + 1}: <prod><xProd> (descrição) é obrigatório`,
            severity: 'critical',
          })
        }

        if (!prod.CFOP) {
          errors.push({
            code: `MISSING_CFOP_${index}`,
            message: `Item ${index + 1}: <prod><CFOP> é obrigatório`,
            severity: 'critical',
          })
        } else if (!/^\d{4}$/.test(String(prod.CFOP))) {
          errors.push({
            code: `INVALID_CFOP_${index}`,
            message: `Item ${index + 1}: CFOP inválido. Deve ser formato DDDD`,
            severity: 'error',
          })
        }

        if (!prod.qCom) {
          errors.push({
            code: `MISSING_QCOM_${index}`,
            message: `Item ${index + 1}: <prod><qCom> (quantidade) é obrigatório`,
            severity: 'critical',
          })
        } else if (Number.isNaN(Number.parseFloat(String(prod.qCom)))) {
          errors.push({
            code: `INVALID_QCOM_${index}`,
            message: `Item ${index + 1}: Quantidade deve ser numérica`,
            severity: 'error',
          })
        }

        if (!prod.vUnCom) {
          errors.push({
            code: `MISSING_VUNCOM_${index}`,
            message: `Item ${index + 1}: <prod><vUnCom> (valor unitário) é obrigatório`,
            severity: 'critical',
          })
        } else if (Number.isNaN(Number.parseFloat(String(prod.vUnCom)))) {
          errors.push({
            code: `INVALID_VUNCOM_${index}`,
            message: `Item ${index + 1}: Valor unitário deve ser numérico`,
            severity: 'error',
          })
        }
      })

      if (detArray.length > 999) {
        warnings.push(`Nota contém ${detArray.length} itens. SEFAZ permite máximo 999 itens.`)
      }

      return { errors, warnings }
    } catch (error) {
      errors.push({
        code: 'ITEMS_VALIDATION_ERROR',
        message: `Erro ao validar itens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error',
      })
      return { errors, warnings }
    }
  }

  /**
   * Valida totalizadores (valores)
   */
  private validateTotals(infNFe: any): { errors: ValidationError[]; warnings: string[] } {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    try {
      const total = infNFe.total
      if (!total || !total.ICMSTot) return { errors, warnings }

      const icmsTot = total.ICMSTot

      // Valida campos numéricos obrigatórios
      const numericFields = [
        'vBC',
        'vICMS',
        'vBCST',
        'vST',
        'vProd',
        'vFrete',
        'vSeg',
        'vDesc',
        'vII',
        'vIPI',
        'vPIS',
        'vCOFINS',
        'vOutro',
        'vNF',
      ]

      numericFields.forEach((field) => {
        if (icmsTot[field] !== undefined && icmsTot[field] !== null) {
          const value = icmsTot[field]
          if (Number.isNaN(Number.parseFloat(String(value)))) {
            errors.push({
              code: `INVALID_NUMERIC_${field}`,
              message: `Campo <total><ICMSTot><${field}> deve ser numérico`,
              severity: 'error',
            })
          }

          // Valida valor negativo
          if (Number.parseFloat(String(value)) < 0) {
            errors.push({
              code: `NEGATIVE_VALUE_${field}`,
              message: `Campo <total><ICMSTot><${field}> não pode ser negativo`,
              severity: 'error',
            })
          }
        }
      })

      // Valida que vNF é obrigatório
      if (!icmsTot.vNF && icmsTot.vNF !== 0) {
        errors.push({
          code: 'MISSING_VNF',
          message: '<total><ICMSTot><vNF> (valor total da NF) é obrigatório',
          severity: 'critical',
        })
      }

      // Valida que vProd é obrigatório
      if (!icmsTot.vProd && icmsTot.vProd !== 0) {
        errors.push({
          code: 'MISSING_VPROD',
          message: '<total><ICMSTot><vProd> (valor total dos produtos) é obrigatório',
          severity: 'critical',
        })
      }

      return { errors, warnings }
    } catch (error) {
      errors.push({
        code: 'TOTALS_VALIDATION_ERROR',
        message: `Erro ao validar totalizadores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error',
      })
      return { errors, warnings }
    }
  }

  /**
   * Valida emitente
   */
  private validateEmitter(infNFe: any): { errors: ValidationError[] } {
    const errors: ValidationError[] = []

    try {
      const emit = infNFe.emit
      if (!emit) return { errors }

      const enderEmit = emit.enderEmit
      if (!enderEmit) {
        errors.push({
          code: 'MISSING_ENDEREMIT',
          message: '<emit><enderEmit> (endereço do emitente) é obrigatório',
          severity: 'critical',
        })
        return { errors }
      }

      // Valida campos do endereço
      if (!enderEmit.xLgr) {
        errors.push({
          code: 'MISSING_XLG_EMIT',
          message: '<emit><enderEmit><xLgr> (logradouro) é obrigatório',
          severity: 'critical',
        })
      }

      if (!enderEmit.nro && enderEmit.nro !== '0') {
        errors.push({
          code: 'MISSING_NRO_EMIT',
          message: '<emit><enderEmit><nro> (número) é obrigatório',
          severity: 'critical',
        })
      }

      if (!enderEmit.xMun) {
        errors.push({
          code: 'MISSING_XMUN_EMIT',
          message: '<emit><enderEmit><xMun> (município) é obrigatório',
          severity: 'critical',
        })
      }

      if (!enderEmit.CEP) {
        errors.push({
          code: 'MISSING_CEP_EMIT',
          message: '<emit><enderEmit><CEP> é obrigatório',
          severity: 'critical',
        })
      } else if (!/^\d{8}$/.test(String(enderEmit.CEP).replace('-', ''))) {
        errors.push({
          code: 'INVALID_CEP_EMIT',
          message: '<emit><enderEmit><CEP> deve ter 8 dígitos',
          severity: 'error',
        })
      }

      return { errors }
    } catch (error) {
      errors.push({
        code: 'EMITTER_VALIDATION_ERROR',
        message: `Erro ao validar emitente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error',
      })
      return { errors }
    }
  }

  /**
   * Valida estrutura da assinatura
   */
  private validateSignatureStructure(xmlContent: string): {
    isValid: boolean
    errors: ValidationError[]
    warnings: string[]
    elementCount: number
  } {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    let elementCount = 0

    try {
      // Conta quantas assinaturas há
      const signatureMatches = xmlContent.match(/<Signature[^>]*>/g) || []
      elementCount = signatureMatches.length

      if (elementCount === 0) {
        errors.push({
          code: 'NO_SIGNATURE_TAG',
          message: 'Tag <Signature> não encontrada',
          severity: 'critical',
        })
        return { isValid: false, errors, warnings, elementCount }
      }

      if (elementCount > 1) {
        warnings.push(`XML contém ${elementCount} assinaturas. Esperado: 1`)
      }

      // Valida estrutura interna
      const requiredElements = ['SignedInfo', 'SignatureValue', 'KeyInfo']
      requiredElements.forEach((element) => {
        const matcher = new RegExp(`<(?:\\w+:)?${element}\\b`)
        if (!matcher.test(xmlContent)) {
          errors.push({
            code: `MISSING_SIG_${element.toUpperCase()}`,
            message: `Elemento <${element}> ausente na assinatura`,
            severity: 'critical',
          })
        }
      })

      // Valida que X509Certificate está presente
      if (!xmlContent.includes('X509Certificate')) {
        errors.push({
          code: 'MISSING_X509_CERT',
          message: '<X509Certificate> (certificado) não encontrado na assinatura',
          severity: 'critical',
        })
      }

      // Valida que SignatureValue está preenchido
      const sigValueMatch = xmlContent.match(/<SignatureValue>([^<]*)<\/SignatureValue>/)
      if (!sigValueMatch || !sigValueMatch[1] || sigValueMatch[1].trim().length === 0) {
        errors.push({
          code: 'EMPTY_SIGNATURE_VALUE',
          message: '<SignatureValue> está vazio',
          severity: 'critical',
        })
      }

      // Valida que DigestValue está preenchido
      const digestValueMatch = xmlContent.match(/<DigestValue>([^<]*)<\/DigestValue>/)
      if (!digestValueMatch || !digestValueMatch[1] || digestValueMatch[1].trim().length === 0) {
        errors.push({
          code: 'EMPTY_DIGEST_VALUE',
          message: '<DigestValue> está vazio',
          severity: 'critical',
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        elementCount,
      }
    } catch (error) {
      errors.push({
        code: 'SIGNATURE_STRUCTURE_ERROR',
        message: `Erro ao validar estrutura da assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'critical',
      })
      return { isValid: false, errors, warnings, elementCount }
    }
  }

  /**
   * Gera relatório legível de validação
   */
  static generateReport(result: XMLValidationResult): string {
    let report = '📋 RELATÓRIO DE VALIDAÇÃO XML\n'
    report += '═'.repeat(50) + '\n\n'

    // Status geral
    report += `✅ RESULTADO GERAL: ${result.isValid ? 'VÁLIDO ✓' : 'INVÁLIDO ✗'}\n\n`

    // Checklist
    report += '📊 CHECKLIST:\n'
    report += `  ${result.wellFormed ? '✓' : '✗'} XML bem-formado\n`
    report += `  ${result.hasMandatoryFields ? '✓' : '✗'} Campos obrigatórios\n`
    report += `  ${result.isSigned ? '✓' : '✗'} Assinado\n`
    report += `  ${result.signatureValid ? '✓' : '✗'} Assinatura válida\n\n`

    // Metadados
    if (Object.keys(result.details).length > 0) {
      report += '📄 METADADOS:\n'
      if (result.details.xmlVersion) report += `  • Versão XML: ${result.details.xmlVersion}\n`
      if (result.details.encoding) report += `  • Encoding: ${result.details.encoding}\n`
      if (result.details.rootElement) report += `  • Elemento raiz: ${result.details.rootElement}\n`
      if (result.details.nfeNumber) report += `  • Número NF-e: ${result.details.nfeNumber}\n`
      if (result.details.signatureElements)
        report += `  • Assinaturas: ${result.details.signatureElements}\n`
      report += '\n'
    }

    // Erros críticos
    const criticalErrors = result.errors.filter((e) => e.severity === 'critical')
    if (criticalErrors.length > 0) {
      report += `❌ ERROS CRÍTICOS (${criticalErrors.length}):\n`
      criticalErrors.forEach((err) => {
        report += `  • [${err.code}] ${err.message}\n`
      })
      report += '\n'
    }

    // Erros normais
    const normalErrors = result.errors.filter((e) => e.severity === 'error')
    if (normalErrors.length > 0) {
      report += `⚠️  ERROS (${normalErrors.length}):\n`
      normalErrors.forEach((err) => {
        report += `  • [${err.code}] ${err.message}\n`
      })
      report += '\n'
    }

    // Avisos
    if (result.warnings.length > 0) {
      report += `⚠️  AVISOS (${result.warnings.length}):\n`
      result.warnings.forEach((warn) => {
        report += `  • ${warn}\n`
      })
      report += '\n'
    }

    // Resumo final
    if (result.isValid) {
      report += '✅ XML APROVADO - Pronto para envio ao SEFAZ\n'
    } else {
      report += '❌ XML REJEITADO - Corrija os erros antes de enviar\n'
    }

    return report
  }
}
