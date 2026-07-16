import axios, { type AxiosInstance } from 'axios'
import https from 'node:https'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'
import FiscalRoutingService, { type SefazEndpoints } from './fiscal_routing_service.js'
import SefazSoapBuilder from './sefaz/sefaz_soap_builder.js'
import SefazResponseParser from './sefaz/sefaz_response_parser.js'
import SefazCertificateLoader from './sefaz/sefaz_certificate_loader.js'
import type { SefazResponse, SefazWebserviceConfig } from './sefaz/types.js'

/**
 * Transmissor de XML assinado para Web Services da SEFAZ via HTTPS + mTLS.
 *
 * Protocolo: SOAP 1.2, NF-e 4.00 (NT 2016.002)
 *  - Content-Type: application/soap+xml; charset=utf-8
 *  - Sem nfeCabecMsg no SOAP Header
 *  - mTLS com certificado A1 do contribuinte
 */
export default class FiscalTransmitter {
  private static readonly DEFAULT_TIMEOUT_MS = 30_000

  /**
   * SOAP Actions para NF-e 4.00 — obrigatórios no Content-Type para endpoints .asmx (SOAP 1.2)
   */
  private static readonly SOAP_ACTIONS = {
    autorizacao: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
    consultaProtocolo:
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
    recepcaoEvento: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento',
    statusServico: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF',
  } as const

  private client: AxiosInstance | null = null
  private config: SefazWebserviceConfig
  private endpoints: SefazEndpoints
  private soapBuilder: SefazSoapBuilder

  constructor(config: SefazWebserviceConfig) {
    this.config = config
    this.endpoints = FiscalRoutingService.resolveEndpoints(config.state, config.homologation)
    this.soapBuilder = new SefazSoapBuilder(config.state, config.homologation ? 2 : 1)

    logger.info(
      {
        uf: config.state,
        homologacao: config.homologation,
        autorizador: FiscalRoutingService.getAutorizador(config.state),
        endpoint: this.endpoints.autorizacao,
      },
      '[FiscalTransmitter] Inicializado'
    )
  }

  // ─── Autorização ───────────────────────────────────────────────────

  async authorizeNFCe(
    xmlContent: string,
    context?: { vendaId?: number; establishmentId?: number; cnpj?: string | null }
  ): Promise<SefazResponse> {
    const endpoint = this.endpoints.autorizacao

    try {
      logger.info(
        { uf: this.config.state, endpoint, vendaId: context?.vendaId },
        '[FiscalTransmitter] Iniciando autorização NFC-e'
      )

      const soapEnvelope = this.soapBuilder.buildAutorizacao(xmlContent)
      const responseText = await this.sendSoap(
        endpoint,
        soapEnvelope,
        FiscalTransmitter.SOAP_ACTIONS.autorizacao,
        context
      )
      const parsed = SefazResponseParser.parse(responseText)

      this.logParsedResponse('AUTHORIZE', parsed, context)

      // Status 100 ou 150 = sucesso; qualquer outro vem com parsed.error preenchido
      return parsed
    } catch (error) {
      return this.handleTransportError(error, endpoint, context)
    }
  }

  // ─── Consulta de Protocolo ─────────────────────────────────────────

  async queryNFCeStatus(accessKey: string): Promise<SefazResponse> {
    const endpoint = this.endpoints.consultaProtocolo

    try {
      logger.info(
        { accessKey, uf: this.config.state, endpoint },
        '[FiscalTransmitter] Consultando status NFC-e'
      )

      const soapEnvelope = this.soapBuilder.buildConsultaProtocolo(accessKey)
      const responseText = await this.sendSoap(
        endpoint,
        soapEnvelope,
        FiscalTransmitter.SOAP_ACTIONS.consultaProtocolo,
        { accessKey }
      )
      const parsed = SefazResponseParser.parse(responseText)

      this.logParsedResponse('QUERY_STATUS', parsed, { accessKey })
      return parsed
    } catch (error) {
      return this.handleTransportError(error, endpoint, { accessKey })
    }
  }

  // ─── Cancelamento ──────────────────────────────────────────────────

  async cancelNFCe(
    accessKey: string,
    protocolNumber: string,
    justification: string,
    cnpj: string
  ): Promise<SefazResponse> {
    const endpoint = this.endpoints.recepcaoEvento

    try {
      logger.info(
        { accessKey, uf: this.config.state, endpoint },
        '[FiscalTransmitter] Iniciando cancelamento NFC-e'
      )

      const soapEnvelope = this.soapBuilder.buildCancelamento(
        accessKey,
        protocolNumber,
        justification,
        cnpj
      )
      const responseText = await this.sendSoap(
        endpoint,
        soapEnvelope,
        FiscalTransmitter.SOAP_ACTIONS.recepcaoEvento,
        { accessKey }
      )
      const parsed = SefazResponseParser.parse(responseText)

      this.logParsedResponse('CANCEL', parsed, { accessKey })
      return parsed
    } catch (error) {
      return this.handleTransportError(error, endpoint, { accessKey })
    }
  }

  // ─── Core: envio SOAP ──────────────────────────────────────────────

  /**
   * Envia um envelope SOAP 1.2 para o endpoint da SEFAZ via mTLS.
   * Retries de transporte são responsabilidade do chamador.
   */
  private async sendSoap(
    endpoint: string,
    soapEnvelope: string,
    soapAction: string,
    context?: Record<string, unknown>
  ): Promise<string> {
    const client = await this.ensureClient()
    const timeoutMs = this.getTimeoutMs()
    const contentType = `application/soap+xml;charset=utf-8;action="${soapAction}"`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      if (this.shouldLogPayload()) {
        cloudLogger.info('FISCAL_SEFAZ_REQUEST_PAYLOAD', {
          endpoint,
          uf: this.config.state,
          soapAction,
          contentType,
          payloadSize: Buffer.byteLength(soapEnvelope, 'utf8'),
          payload: soapEnvelope,
          ...context,
        })
      }

      const response = await client.post(endpoint, soapEnvelope, {
        headers: { 'Content-Type': contentType },
        timeout: timeoutMs,
        signal: controller.signal,
      })

      const responseText = typeof response.data === 'string' ? response.data : String(response.data)

      cloudLogger.info('FISCAL_SEFAZ_RESPONSE', {
        endpoint,
        uf: this.config.state,
        httpStatus: response.status,
        responseSize: responseText.length,
        responseSnippet: responseText.slice(0, 1500),
        ...context,
      })

      return responseText
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // ─── Client mTLS ───────────────────────────────────────────────────

  private async ensureClient(): Promise<AxiosInstance> {
    if (!this.client) {
      this.client = await this.createClient()
    }
    return this.client
  }

  private async createClient(): Promise<AxiosInstance> {
    const { cert, key, ca } = await new SefazCertificateLoader(this.config).load()
    const timeoutMs = this.getTimeoutMs()

    const httpsAgent = new https.Agent({
      cert,
      key,
      ca,
      rejectUnauthorized: true,
      timeout: timeoutMs,
    })

    return axios.create({
      timeout: timeoutMs,
      timeoutErrorMessage: 'SEFAZ_TIMEOUT',
      httpsAgent,
    })
  }

  // ─── Logging & Erros ──────────────────────────────────────────────

  private logParsedResponse(
    operation: string,
    parsed: SefazResponse,
    context?: Record<string, unknown>
  ): void {
    const logPayload = {
      operation,
      uf: this.config.state,
      status: parsed.status,
      message: parsed.message,
      accessKey: parsed.accessKey,
      protocolNumber: parsed.protocolNumber,
      hasError: !!parsed.error,
      ...context,
    }

    if (parsed.error) {
      logger.warn(logPayload, `[FiscalTransmitter] ${operation} retornou erro semântico`)
      cloudLogger.warn(`FISCAL_SEFAZ_${operation}_ERROR`, logPayload)
    } else {
      logger.info(logPayload, `[FiscalTransmitter] ${operation} sucesso`)
      cloudLogger.info(`FISCAL_SEFAZ_${operation}_OK`, logPayload)
    }
  }

  /**
   * Traduz erros de transporte (HTTP, timeout, TLS) em SefazResponse.
   */
  private handleTransportError(
    error: unknown,
    endpoint: string,
    context?: Record<string, unknown>
  ): SefazResponse {
    const axErr = error as any
    const status: number | undefined = axErr?.response?.status
    const responseText: string = axErr?.response?.data ? String(axErr.response.data) : ''
    const baseMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const code: string | undefined = axErr?.code

    // Timeout
    const isTimeout =
      code === 'ECONNABORTED' || code === 'ERR_CANCELED' || baseMessage === 'SEFAZ_TIMEOUT'

    // Se a SEFAZ retornou HTTP 500 com body SOAP, ainda tenta parsear
    if (status && status >= 400 && responseText.includes('<cStat>')) {
      const parsed = SefazResponseParser.parse(responseText)
      logger.warn(
        { status, endpoint, ...context, sefazStatus: parsed.status, sefazMessage: parsed.message },
        '[FiscalTransmitter] HTTP erro mas SEFAZ retornou cStat no body'
      )
      return parsed
    }

    const errorMessage = isTimeout
      ? `Timeout ao comunicar com SEFAZ (${this.getTimeoutMs()}ms) - endpoint: ${endpoint}`
      : status
        ? `SEFAZ HTTP ${status}: ${baseMessage}${responseText ? ` | body=${responseText.slice(0, 500)}` : ''}`
        : `Erro de transporte para SEFAZ: ${baseMessage}`

    logger.error(
      {
        error: errorMessage,
        status,
        endpoint,
        uf: this.config.state,
        code,
        responseSnippet: responseText.slice(0, 1000),
        ...context,
      },
      '[FiscalTransmitter] Erro de transporte'
    )
    cloudLogger.error('FISCAL_SEFAZ_TRANSPORT_ERROR', {
      error: errorMessage,
      status,
      endpoint,
      uf: this.config.state,
      responseSnippet: responseText.slice(0, 1000),
      ...context,
    })

    return { error: errorMessage }
  }

  // ─── Config helpers ────────────────────────────────────────────────

  private shouldLogPayload(): boolean {
    const raw = process.env.FISCAL_SEFAZ_LOG_PAYLOAD
    if (!raw) return false
    return ['1', 'true', 'yes', 'on', 'full'].includes(raw.toLowerCase())
  }

  private getTimeoutMs(): number {
    const raw = process.env.FISCAL_SEFAZ_TIMEOUT_MS
    const value = raw ? Number(raw) : Number.NaN
    if (!Number.isFinite(value) || value <= 0) {
      return FiscalTransmitter.DEFAULT_TIMEOUT_MS
    }
    return value
  }
}
