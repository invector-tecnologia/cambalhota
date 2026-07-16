import { XMLParser } from 'fast-xml-parser'
import logger from '@adonisjs/core/services/logger'

/**
 * Estrutura completa de resposta da SEFAZ
 */
export interface SefazResponse {
  success: boolean
  statusCode: number
  statusMessage: string
  accessKey?: string
  protocolNumber?: string
  authorizationDate?: Date
  errors?: SefazError[]
  warnings?: string[]
  xml?: string
}

export interface SefazError {
  code: string
  message: string
  field?: string
}

/**
 * Parser robusto para respostas SOAP/XML da SEFAZ
 * Suporta todos os tipos de resposta: autorização, consulta, cancelamento, inutilização
 */
export class SefazResponseParser {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    })
  }

  /**
   * Faz parse completo da resposta de autorização de NF-e/NFC-e
   */
  parseAuthorizationResponse(xmlString: string): SefazResponse {
    try {
      const parsed = this.parser.parse(xmlString)

      // Navega pela estrutura SOAP
      const envelope = parsed['soap:Envelope'] || parsed['soapenv:Envelope'] || parsed.Envelope
      if (!envelope) {
        throw new Error('Envelope SOAP não encontrado na resposta')
      }

      const body = envelope['soap:Body'] || envelope['soapenv:Body'] || envelope.Body
      if (!body) {
        throw new Error('Body SOAP não encontrado na resposta')
      }

      // Resposta de autorização
      const nfeResult =
        body.nfeResultMsg ||
        body.nfeAutorizacaoLoteResult ||
        body.NFeAutorizacaoResult ||
        body.retEnviNFe

      if (!nfeResult) {
        throw new Error('Resultado de autorização não encontrado na resposta')
      }

      // Parse do protocolo de autorização
      return this.parseProtocol(nfeResult)
    } catch (error) {
      logger.error({ error }, 'Erro ao fazer parse da resposta de autorização')
      return {
        success: false,
        statusCode: 999,
        statusMessage: 'Erro ao processar resposta da SEFAZ',
        errors: [
          {
            code: '999',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          },
        ],
      }
    }
  }

  /**
   * Faz parse da resposta de consulta de protocolo
   */
  parseQueryResponse(xmlString: string): SefazResponse {
    try {
      const parsed = this.parser.parse(xmlString)

      const envelope = parsed['soap:Envelope'] || parsed['soapenv:Envelope'] || parsed.Envelope
      const body = envelope?.['soap:Body'] || envelope?.['soapenv:Body'] || envelope?.Body

      const queryResult =
        body?.nfeResultMsg ||
        body?.nfeConsultaNFResult ||
        body?.NFeConsultaProtocoloResult ||
        body?.retConsSitNFe

      if (!queryResult) {
        throw new Error('Resultado de consulta não encontrado')
      }

      return this.parseProtocol(queryResult)
    } catch (error) {
      logger.error({ error }, 'Erro ao fazer parse da resposta de consulta')
      return {
        success: false,
        statusCode: 999,
        statusMessage: 'Erro ao processar resposta da SEFAZ',
        errors: [
          {
            code: '999',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          },
        ],
      }
    }
  }

  /**
   * Faz parse da resposta de evento (cancelamento, carta de correção, etc)
   */
  parseEventResponse(xmlString: string): SefazResponse {
    try {
      const parsed = this.parser.parse(xmlString)

      const envelope = parsed['soap:Envelope'] || parsed['soapenv:Envelope'] || parsed.Envelope
      const body = envelope?.['soap:Body'] || envelope?.['soapenv:Body'] || envelope?.Body

      const eventResult =
        body?.nfeResultMsg ||
        body?.nfeRecepcaoEventoResult ||
        body?.NFeRecepcaoEventoResult ||
        body?.retEnvEvento

      if (!eventResult) {
        throw new Error('Resultado de evento não encontrado')
      }

      return this.parseEventProtocol(eventResult)
    } catch (error) {
      logger.error({ error }, 'Erro ao fazer parse da resposta de evento')
      return {
        success: false,
        statusCode: 999,
        statusMessage: 'Erro ao processar resposta da SEFAZ',
        errors: [
          {
            code: '999',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          },
        ],
      }
    }
  }

  /**
   * Extrai dados do protocolo de autorização/consulta
   */
  private parseProtocol(resultObj: any): SefazResponse {
    // Status do lote/nota
    const statusCode = Number(resultObj.cStat || resultObj.protNFe?.infProt?.cStat || 0)
    const statusMessage =
      resultObj.xMotivo || resultObj.protNFe?.infProt?.xMotivo || 'Status desconhecido'

    // Chave de acesso
    const accessKey = resultObj.chNFe || resultObj.protNFe?.infProt?.chNFe

    // Protocolo de autorização
    const protocolNumber = resultObj.nProt || resultObj.protNFe?.infProt?.nProt

    // Data de autorização
    let authorizationDate: Date | undefined
    const dhRecbto = resultObj.dhRecbto || resultObj.protNFe?.infProt?.dhRecbto
    if (dhRecbto) {
      authorizationDate = new Date(dhRecbto)
    }

    // Determina se foi sucesso
    const success = this.isSuccessCode(statusCode)

    // Extrai erros (se houver)
    const errors: SefazError[] = []
    const warnings: string[] = []

    if (!success) {
      errors.push({
        code: statusCode.toString(),
        message: statusMessage,
      })
    }

    // XML autorizado (se disponível)
    const xml = resultObj.protNFe ? this.reconstructProtocolXML(resultObj.protNFe) : undefined

    return {
      success,
      statusCode,
      statusMessage,
      accessKey,
      protocolNumber,
      authorizationDate,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      xml,
    }
  }

  /**
   * Parse específico para eventos (cancelamento, CC-e, etc)
   */
  private parseEventProtocol(resultObj: any): SefazResponse {
    const statusCode = Number(resultObj.cStat || resultObj.retEvento?.infEvento?.cStat || 0)
    const statusMessage =
      resultObj.xMotivo || resultObj.retEvento?.infEvento?.xMotivo || 'Status desconhecido'

    const accessKey = resultObj.chNFe || resultObj.retEvento?.infEvento?.chNFe
    const protocolNumber = resultObj.nProt || resultObj.retEvento?.infEvento?.nProt

    let authorizationDate: Date | undefined
    const dhRegEvento = resultObj.dhRegEvento || resultObj.retEvento?.infEvento?.dhRegEvento
    if (dhRegEvento) {
      authorizationDate = new Date(dhRegEvento)
    }

    const success = this.isSuccessCode(statusCode)

    const errors: SefazError[] = []
    if (!success) {
      errors.push({
        code: statusCode.toString(),
        message: statusMessage,
      })
    }

    return {
      success,
      statusCode,
      statusMessage,
      accessKey,
      protocolNumber,
      authorizationDate,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Verifica se o código de status indica sucesso
   * Códigos de sucesso conhecidos:
   * - 100: Autorizado o uso da NF-e
   * - 101: Cancelamento homologado
   * - 102: Inutilização homologada
   * - 135: Evento registrado e vinculado à NF-e
   * - 151: Autorizada a Consulta de NF-e - somente a empresa emitente
   * - 155: NF-e complementar não autorizada
   */
  private isSuccessCode(code: number): boolean {
    const successCodes = [100, 101, 102, 135, 151]
    return successCodes.includes(code)
  }

  /**
   * Reconstrói XML do protocolo para armazenamento
   */
  private reconstructProtocolXML(_protNFe: any): string | undefined {
    try {
      // Aqui seria necessário usar xml-js ou similar para reconstruir
      // Por ora, retorna undefined
      return undefined
    } catch {
      return undefined
    }
  }

  /**
   * Obtém mensagem amigável para código de status
   */
  static getStatusDescription(code: number): string {
    const descriptions: Record<number, string> = {
      // Sucesso
      100: 'Autorizado o uso da NF-e',
      101: 'Cancelamento de NF-e homologado',
      102: 'Inutilização de número homologada',
      135: 'Evento registrado e vinculado à NF-e',
      151: 'Consulta autorizada - empresa emitente',

      // Processamento
      103: 'Lote recebido com sucesso',
      104: 'Lote processado',
      105: 'Lote em processamento',

      // Rejeições comuns
      204: 'Duplicidade de NF-e',
      205: 'NF-e está denegada na base de dados da SEFAZ',
      206: 'NF-e já está inutilizada na Base de dados da SEFAZ',
      207: 'CNPJ do emitente inválido',
      208: 'CNPJ do destinatário inválido',
      209: 'IE do emitente inválida',
      210: 'IE do destinatário inválida',
      211: 'IE do emitente não cadastrada',
      212: 'IE do destinatário não cadastrada',
      213: 'Modelo da NF-e diferente de 55',
      214: 'NF-e fora do prazo de emissão (30 dias)',
      215: 'Região de emissão difere de autorização',
      216: 'Data de emissão muito atrasada',
      217: 'Data de emissão futura',
      218: 'CNPJ da chave de acesso difere do CNPJ certificado',

      // Erros de validação XML
      225: 'Falha no schema XML',
      226: 'Código UF divergente',
      227: 'Erro na chave de acesso',
      228: 'Data de emissão divergente',
      229: 'IE do emitente divergente',
      230: 'IE do emitente não vinculada ao CNPJ',
      231: 'IE do destinatário não vinculada ao CNPJ',

      // Totalizadores
      401: 'Total da NF divergente',
      402: 'Total do ICMS divergente',
      403: 'Total do IPI divergente',
      404: 'Total do PIS divergente',
      405: 'Total do COFINS divergente',

      // Certificado
      539: 'CNPJ-Base do Emitente difere do CNPJ-Base do Certificado Digital',
      540: 'Certificado digital vencido',
      541: 'Certificado digital revogado',

      // Contingência
      656: 'Consulta de documento fiscal para destinatário não habilitado',
      657: 'NF-e em contingência não emitida',

      // Denegação
      301: 'Uso Denegado: Irregularidade fiscal do emitente',
      302: 'Uso Denegado: Irregularidade fiscal do destinatário',

      // Genérico
      999: 'Erro não catalogado',
    }

    return descriptions[code] || `Status desconhecido: ${code}`
  }
}
