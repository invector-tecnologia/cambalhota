import FiscalConfig from '#models/fiscal_config'
import FiscalNote from '#models/fiscal_note'
import FiscalTransformer from './fiscal_transformer.js'
import FiscalSigner from './fiscal_signer.js'
import QRCodeNFCeGenerator from './qrcode_nfce_generator.js'
import FiscalXsdValidator from './fiscal_xsd_validator.js'
import FiscalTransmitter from './fiscal_transmitter.js'
import FiscalRoutingService from './fiscal_routing_service.js'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'
import type Venda from '#models/venda'

export default class FiscalEmissionWorkflow {
  async emit(
    venda: Venda,
    establishmentId: number,
    options?: { customerCpf?: string }
  ): Promise<FiscalNote> {
    let fiscalNote: FiscalNote | null = null
    let sefazUrl = 'N/A'
    let environmentName = 'N/A'

    try {
      logger.info(
        { vendaId: venda.id, establishmentId, environment: process.env.NODE_ENV },
        '[FISCAL_SERVICE] EMIT_START'
      )
      await venda.load('empresa')
      cloudLogger.info('FISCAL_EMIT_START', {
        vendaId: venda.id,
        establishmentId,
        cnpj: venda.empresa?.cnpj,
        environment: process.env.NODE_ENV,
      })

      const fiscalConfig = await FiscalConfig.findByOrFail('establishment_id', establishmentId)
      const uf = await fiscalConfig.getEffectiveState()
      const isHomologation = fiscalConfig.isHomologation
      environmentName = isHomologation ? 'Homologação' : 'Produção'
      const endpoints = FiscalRoutingService.resolveEndpoints(uf, isHomologation)
      sefazUrl = endpoints.autorizacao

      this.logHomologationMode(venda, uf, environmentName, sefazUrl, isHomologation)

      logger.info(
        {
          vendaId: venda.id,
          uf,
          environment: environmentName,
          sefazUrl,
        },
        '[FISCAL_SERVICE] VALIDATING_EMPRESA_DATA'
      )

      // Check if there's an existing PENDING or ERROR fiscal note for this venda
      let existingNote = await FiscalNote.query()
        .where('venda_id', venda.id)
        .whereIn('status', ['PENDING', 'ERROR'])
        .whereNotNull('xml_content')
        .whereNotNull('access_key')
        .first()

      let xmlContent: string
      let reservedNumber: number

      if (existingNote) {
        // Verifica se é realmente uma nota que pode ser reprocessada
        if (existingNote.attemptCount && existingNote.attemptCount >= 5) {
          throw new Error(
            `Nota fiscal ${existingNote.id} atingiu limite de tentativas (5). Requerem análise manual.`
          )
        }

        logger.info(
          {
            vendaId: venda.id,
            fiscalNoteId: existingNote.id,
            accessKey: existingNote.accessKey,
            numero: existingNote.numero,
            status: existingNote.status,
            attemptCount: existingNote.attemptCount,
          },
          '[FISCAL_SERVICE] REUSING_EXISTING_NOTE'
        )
        cloudLogger.info('FISCAL_REUSING_EXISTING_NOTE', {
          vendaId: venda.id,
          fiscalNoteId: existingNote.id,
          accessKey: existingNote.accessKey,
          numero: existingNote.numero,
          previousStatus: existingNote.status,
          attemptCount: existingNote.attemptCount,
        })

        // Reuse existing XML and number to maintain same access key
        xmlContent = existingNote.xmlContent!
        reservedNumber = existingNote.numero!
        fiscalNote = existingNote

        // Update status to PENDING if it was ERROR
        if (fiscalNote.status === 'ERROR') {
          fiscalNote.status = 'PENDING'
          // Clear error log when retrying
          fiscalNote.errorLog = null
          await fiscalNote.save()
        }
      } else {
        // Generate new XML and reserve new number
        reservedNumber = await FiscalConfig.incrementNextNfeNumber(establishmentId)
        xmlContent = await this.buildXml(venda, fiscalConfig, reservedNumber, options)
        fiscalNote = await this.createPendingNote(
          venda,
          fiscalConfig,
          xmlContent,
          reservedNumber,
          uf
        )
      }

      try {
        logger.info(
          { fiscalNoteId: fiscalNote.id, vendaId: venda.id },
          '[FISCAL_SERVICE] SIGN_XML_START'
        )
        const signedXmlWithSupl = await this.signAndValidateXml(
          xmlContent,
          venda,
          fiscalConfig,
          options
        )
        logger.info(
          { fiscalNoteId: fiscalNote.id, vendaId: venda.id },
          '[FISCAL_SERVICE] SIGN_XML_SUCCESS'
        )

        const extractedAccessKey = this.extractAccessKey(signedXmlWithSupl)
        if (extractedAccessKey && !fiscalNote.accessKey) {
          fiscalNote.accessKey = extractedAccessKey
          await fiscalNote.save()
          logger.info(
            { fiscalNoteId: fiscalNote.id, accessKey: extractedAccessKey },
            '[FISCAL_SERVICE] ACCESS_KEY_UPDATED'
          )
        }

        if (!FiscalRoutingService.supportsNFCe(uf)) {
          await fiscalNote.markAsError({
            error: 'UF_NOT_SUPPORTED',
            message: `UF ${uf} não suporta emissão de NFC-e`,
          })
          logger.error(
            {
              fiscalNoteId: fiscalNote.id,
              uf,
              error: `UF ${uf} não suporta NFC-e`,
              environment: environmentName,
              sefazUrl,
            },
            '[FISCAL_SERVICE] UF_NOT_SUPPORTED'
          )
          throw new Error(`UF ${uf} não suporta emissão de NFC-e no momento`)
        }

        const autorizador = FiscalRoutingService.getAutorizador(uf)
        if (fiscalConfig.autorizador !== autorizador) {
          fiscalConfig.autorizador = autorizador
          await fiscalConfig.save()
        }

        logger.info(
          {
            fiscalNoteId: fiscalNote.id,
            uf,
            autorizador,
            homologacao: fiscalConfig.isHomologation,
            environment: process.env.NODE_ENV,
          },
          '[FISCAL_SERVICE] TRANSMIT_START'
        )
        cloudLogger.info('FISCAL_TRANSMIT_START', {
          fiscalNoteId: fiscalNote.id,
          vendaId: venda.id,
          uf,
          autorizador,
          homologacao: fiscalConfig.isHomologation,
          environment: process.env.NODE_ENV,
        })

        const transmitter = new FiscalTransmitter({
          homologation: fiscalConfig.isHomologation,
          state: uf,
          certificatePath: fiscalConfig.certificatePath,
          certificatePassword: fiscalConfig.getDecryptedCertificatePassword(),
        })

        logger.info(
          { fiscalNoteId: fiscalNote.id, vendaId: venda.id, accessKey: fiscalNote.accessKey },
          '[FISCAL_SERVICE] AUTHORIZE_START'
        )
        cloudLogger.info('FISCAL_AUTHORIZE_START', {
          fiscalNoteId: fiscalNote.id,
          vendaId: venda.id,
          accessKey: fiscalNote.accessKey,
        })

        const transmissionResult = await this.authorizeWithTimeout(transmitter, signedXmlWithSupl, {
          vendaId: venda.id,
          establishmentId,
          cnpj: venda.empresa?.cnpj || null,
        })

        const apiUrl = endpoints.autorizacao
        logger.info(
          {
            fiscalNoteId: fiscalNote.id,
            vendaId: venda.id,
            result: transmissionResult,
          },
          '[FISCAL_SERVICE] AUTHORIZE_RESULT_RECEIVED'
        )
        cloudLogger.info('FISCAL_AUTHORIZE_RESULT', {
          fiscalNoteId: fiscalNote.id,
          vendaId: venda.id,
          status: transmissionResult.status,
          hasError: !!transmissionResult.error,
          hasProtocol: !!transmissionResult.protocolNumber,
        })
        if (transmissionResult.error) {
          // ─── cStat=539: Duplicidade de NF-e com diferença na Chave ───
          // A SEFAZ já tem esse nNF registrado com outra chave de acesso.
          // Marca nota atual como CANCELLED, gera novo número e retenta UMA vez.
          if (transmissionResult.status === 539) {
            logger.warn(
              {
                fiscalNoteId: fiscalNote.id,
                numero: fiscalNote.numero,
                vendaId: venda.id,
                error: transmissionResult.error,
              },
              '[FISCAL_SERVICE] DUPLICATE_NFE_539_AUTO_RECOVERY'
            )
            cloudLogger.warn('FISCAL_DUPLICATE_539_AUTO_RECOVERY', {
              fiscalNoteId: fiscalNote.id,
              numero: fiscalNote.numero,
              vendaId: venda.id,
              error: transmissionResult.error,
            })

            // Cancela a nota conflitante para que não seja reutilizada
            fiscalNote.status = 'CANCELLED'
            fiscalNote.isRetryable = false
            fiscalNote.errorLog = {
              sefazError: transmissionResult.error,
              reason: 'DUPLICATE_539_AUTO_CANCELLED',
            }
            await fiscalNote.save()

            // Gera novo número e tenta novamente (recursão limitada pela flag)
            if (!(options as any)?._retryAfter539) {
              logger.info(
                { vendaId: venda.id },
                '[FISCAL_SERVICE] RETRYING_WITH_NEW_NUMBER_AFTER_539'
              )
              return this.emit(venda, establishmentId, {
                ...options,
                _retryAfter539: true,
              } as any)
            }

            // Se já era retry, desiste
            throw new Error(
              `Erro SEFAZ: ${transmissionResult.error} (retry após 539 também falhou)`
            )
          }

          await fiscalNote.markAsError({ sefazError: transmissionResult.error })
          logger.warn(
            {
              error: transmissionResult.error,
              fiscalNoteId: fiscalNote.id,
              uf,
              apiUrl,
              environment: process.env.NODE_ENV,
              homologacao: fiscalConfig.isHomologation,
            },
            '[FISCAL_SERVICE] TRANSMIT_ERROR'
          )
          cloudLogger.error('FISCAL_TRANSMIT_ERROR', {
            fiscalNoteId: fiscalNote.id,
            error: transmissionResult.error,
            uf,
            apiUrl,
            environment: process.env.NODE_ENV,
          })
          throw new Error(`Erro SEFAZ: ${transmissionResult.error}`)
        }

        cloudLogger.info('FISCAL_TRANSMIT_RESULT', {
          fiscalNoteId: fiscalNote.id,
          vendaId: venda.id,
          accessKey: transmissionResult.accessKey,
          protocolNumber: transmissionResult.protocolNumber,
          status: transmissionResult.status,
          message: transmissionResult.message,
          uf,
          apiUrl,
          environment: process.env.NODE_ENV,
        })

        if (transmissionResult.accessKey && transmissionResult.protocolNumber) {
          logger.info(
            {
              fiscalNoteId: fiscalNote.id,
              vendaId: venda.id,
              protocol: transmissionResult.protocolNumber,
              accessKey: transmissionResult.accessKey,
            },
            '[FISCAL_SERVICE] MARK_AS_AUTHORIZED_START'
          )

          fiscalNote.uf = uf
          const nfeNumber = fiscalNote.numero ?? reservedNumber
          fiscalNote.numero = nfeNumber
          fiscalNote.serie = fiscalConfig.serie || 1
          await fiscalNote.markAsAuthorized(
            transmissionResult.accessKey,
            transmissionResult.protocolNumber
          )
          logger.info(
            {
              accessKey: transmissionResult.accessKey,
              protocolNumber: transmissionResult.protocolNumber,
              fiscalNoteId: fiscalNote.id,
              uf,
              numero: nfeNumber,
              serie: fiscalNote.serie,
              autorizador,
              apiUrl,
              environment: process.env.NODE_ENV,
              homologacao: fiscalConfig.isHomologation,
            },
            '[FISCAL_SERVICE] TRANSMIT_SUCCESS'
          )
          cloudLogger.info('FISCAL_AUTHORIZED', {
            fiscalNoteId: fiscalNote.id,
            vendaId: venda.id,
            accessKey: transmissionResult.accessKey,
            numero: nfeNumber,
            uf,
            cnpj: venda.empresa?.cnpj,
            apiUrl,
            environment: process.env.NODE_ENV,
          })
        } else {
          await fiscalNote.markAsError({ sefazResponse: transmissionResult })
          logger.warn(
            {
              fiscalNoteId: fiscalNote.id,
              response: transmissionResult,
              apiUrl,
              environment: process.env.NODE_ENV,
            },
            '[FISCAL_SERVICE] TRANSMIT_WARNING_NO_KEYS'
          )
        }

        return fiscalNote
      } catch (processingError) {
        const errorMsg =
          processingError instanceof Error ? processingError.message : String(processingError)
        const errorStack = processingError instanceof Error ? processingError.stack : undefined

        logger.error(
          {
            fiscalNoteId: fiscalNote.id,
            error: errorMsg,
            stack: errorStack,
            vendaId: venda.id,
          },
          '[FISCAL_SERVICE] PROCESSING_ERROR_AFTER_CREATE'
        )
        cloudLogger.error('FISCAL_PROCESSING_ERROR', {
          fiscalNoteId: fiscalNote.id,
          vendaId: venda.id,
          error: errorMsg,
          stack: errorStack,
        })

        await fiscalNote.markAsError({
          error: 'PROCESSING_ERROR',
          message: errorMsg,
          stack: errorStack,
          sefazUrl,
          environment: environmentName,
        })
        throw processingError
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      if (fiscalNote && fiscalNote.status === 'PENDING') {
        await fiscalNote.markAsError({
          error: 'EMIT_FAILED',
          message: errorMessage,
          sefazUrl,
          environment: environmentName,
        })
      }

      logger.warn(
        {
          error: errorMessage,
          vendaId: venda.id,
          fiscalNoteId: fiscalNote?.id,
          environment: process.env.NODE_ENV,
          sefazUrl,
          sefazEnvironment: environmentName,
        },
        '[FISCAL_SERVICE] EMIT_FAILED'
      )
      cloudLogger.error('FISCAL_EMIT_FAILED', {
        vendaId: venda.id,
        fiscalNoteId: fiscalNote?.id,
        error: errorMessage,
        cnpj: venda.empresa?.cnpj,
        environment: process.env.NODE_ENV,
        sefazUrl,
        sefazEnvironment: environmentName,
      })
      throw error
    }
  }

  private logHomologationMode(
    venda: Venda,
    uf: string,
    environmentName: string,
    sefazUrl: string,
    isHomologation: boolean
  ): void {
    if (!isHomologation) {
      return
    }

    logger.warn(
      {
        vendaId: venda.id,
        uf,
        environment: environmentName,
        sefazUrl,
        cnpj: venda.empresa?.cnpj,
      },
      '[FISCAL_SERVICE] HOMOLOGATION_MODE_ACTIVE - Dados serão enviados para ambiente de TESTE'
    )

    if (!venda.empresa?.cnpj || venda.empresa.cnpj.trim() === '') {
      const error = 'Emissão em homologação requer CNPJ válido da empresa'
      logger.error(
        { vendaId: venda.id, environment: environmentName },
        '[FISCAL_SERVICE] HOMOLOGATION_CHECK_FAILED'
      )
      cloudLogger.error('FISCAL_HOMOLOGATION_CHECK_FAILED', {
        vendaId: venda.id,
        error,
        environment: environmentName,
      })
      throw new Error(error)
    }

    cloudLogger.warn('FISCAL_HOMOLOGATION_MODE', {
      vendaId: venda.id,
      cnpj: venda.empresa.cnpj,
      uf,
      sefazUrl,
      message: 'Nota fiscal será emitida em ambiente de HOMOLOGAÇÃO (teste)',
    })
  }

  private async buildXml(
    venda: Venda,
    fiscalConfig: FiscalConfig,
    nfeNumber: number,
    options?: { customerCpf?: string }
  ): Promise<string> {
    try {
      return await FiscalTransformer.transformToXml(
        venda,
        venda.empresa,
        fiscalConfig,
        options?.customerCpf,
        {
          nfeNumber,
        }
      )
    } catch (validationError) {
      const errorMsg =
        validationError instanceof Error ? validationError.message : String(validationError)
      logger.error(
        {
          vendaId: venda.id,
          error: errorMsg,
          uf: venda.empresa?.state,
        },
        '[FISCAL_SERVICE] EMPRESA_VALIDATION_FAILED'
      )
      cloudLogger.error('FISCAL_EMPRESA_VALIDATION_FAILED', {
        vendaId: venda.id,
        error: errorMsg,
        cnpj: venda.empresa?.cnpj,
        uf: venda.empresa?.state,
      })
      throw validationError
    }
  }

  private extractAccessKey(xmlContent: string): string | null {
    const match = xmlContent.match(/<infNFe\b[^>]*\bId=["']NFe(\d{44})["']/i)
    return match?.[1] || null
  }

  private async authorizeWithTimeout(
    transmitter: FiscalTransmitter,
    xmlContent: string,
    context?: { vendaId?: number; establishmentId?: number; cnpj?: string | null }
  ) {
    const timeoutMs = this.getTimeoutMs()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('SEFAZ_TRANSMIT_TIMEOUT')), timeoutMs)
    })

    try {
      return await Promise.race([transmitter.authorizeNFCe(xmlContent, context), timeoutPromise])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message === 'SEFAZ_TRANSMIT_TIMEOUT') {
        cloudLogger.error('FISCAL_TRANSMIT_TIMEOUT', {
          vendaId: context?.vendaId,
          establishmentId: context?.establishmentId,
          cnpj: context?.cnpj ?? undefined,
          timeoutMs,
        })
      }
      throw error
    }
  }

  private getTimeoutMs(): number {
    const raw = process.env.FISCAL_SEFAZ_TIMEOUT_MS
    const value = raw ? Number(raw) : Number.NaN
    if (!Number.isFinite(value) || value <= 0) {
      return 60000 // Aumentado de 30s para 60s
    }
    return value
  }

  private async createPendingNote(
    venda: Venda,
    fiscalConfig: FiscalConfig,
    xmlContent: string,
    nfeNumber: number,
    uf: string
  ): Promise<FiscalNote> {
    const accessKey = this.extractAccessKey(xmlContent)

    if (!accessKey) {
      const errorMsg = 'Failed to extract access key from XML'
      logger.error(
        {
          vendaId: venda.id,
          nfeNumber,
          xmlPreview: xmlContent.substring(0, 200),
        },
        '[FISCAL_SERVICE] ACCESS_KEY_EXTRACTION_FAILED'
      )
      cloudLogger.error('FISCAL_ACCESS_KEY_EXTRACTION_FAILED', {
        vendaId: venda.id,
        nfeNumber,
        fiscalConfigId: fiscalConfig.id,
        xmlPreview: xmlContent.substring(0, 200),
      })
      throw new Error(errorMsg)
    }

    const fiscalNote = new FiscalNote()
    fiscalNote.vendaId = venda.id
    fiscalNote.fiscalConfigId = fiscalConfig.id
    fiscalNote.status = 'PENDING'
    fiscalNote.xmlContent = xmlContent
    fiscalNote.accessKey = accessKey
    fiscalNote.numero = nfeNumber
    fiscalNote.serie = fiscalConfig.serie || 1
    fiscalNote.uf = uf
    await fiscalNote.save()

    logger.info(
      {
        fiscalNoteId: fiscalNote.id,
        status: fiscalNote.status,
        accessKey: fiscalNote.accessKey,
        numero: fiscalNote.numero,
      },
      '[FISCAL_SERVICE] FISCAL_NOTE_CREATED'
    )

    logger.info({ fiscalNoteId: fiscalNote.id }, '[FISCAL_SERVICE] FISCAL_XML_GENERATED')

    return fiscalNote
  }

  private async signAndValidateXml(
    xmlContent: string,
    venda: Venda,
    fiscalConfig: FiscalConfig,
    options?: { customerCpf?: string }
  ): Promise<string> {
    cloudLogger.info('FISCAL_SIGN_XML_START', { vendaId: venda.id })

    const signedXml = await FiscalSigner.signXml(
      xmlContent,
      fiscalConfig.certificatePath,
      fiscalConfig.getDecryptedCertificatePassword()
    )

    cloudLogger.info('FISCAL_SIGN_XML_COMPLETE', { vendaId: venda.id })

    const signedXmlWithSupl = this.addNfceSupplementalInfo(
      signedXml,
      venda,
      fiscalConfig,
      options?.customerCpf
    )

    cloudLogger.info('FISCAL_SUPPLEMENTAL_INFO_ADDED', { vendaId: venda.id })

    await this.validateWithXsdIfEnabled(signedXmlWithSupl)

    cloudLogger.info('FISCAL_XSD_VALIDATION_COMPLETE', { vendaId: venda.id })

    logger.info({ vendaId: venda.id }, '[FISCAL_SERVICE] FISCAL_XML_SIGNED')

    return signedXmlWithSupl
  }

  private addNfceSupplementalInfo(
    signedXml: string,
    venda: Venda,
    fiscalConfig: FiscalConfig,
    customerCpf?: string
  ): string {
    if (signedXml.includes('<infNFeSupl>')) {
      return signedXml
    }

    const accessKeyMatch = signedXml.match(/<infNFe\b[^>]*\bId=["']NFe(\d{44})["']/i)
    const tpAmbMatch = signedXml.match(/<tpAmb>(\d)<\/tpAmb>/)
    const dhEmiMatch = signedXml.match(/<dhEmi>([^<]+)<\/dhEmi>/)
    const vNFMatch = signedXml.match(/<vNF>([^<]+)<\/vNF>/)
    const digValMatch = signedXml.match(/<DigestValue>([^<]+)<\/DigestValue>/)

    if (!accessKeyMatch || !tpAmbMatch || !dhEmiMatch || !vNFMatch || !digValMatch) {
      logger.warn('[FISCAL_SERVICE] NFCe supplemental info incompleta; pulando infNFeSupl')
      return signedXml
    }

    const accessKey = accessKeyMatch[1]
    const tpAmb = Number.parseInt(tpAmbMatch[1], 10)
    const dhEmi = dhEmiMatch[1]
    const vNF = Number.parseFloat(vNFMatch[1])
    const digVal = digValMatch[1]

    if (!venda.empresa?.state) {
      logger.warn('[FISCAL_SERVICE] UF da empresa ausente; pulando infNFeSupl')
      return signedXml
    }

    const qrCodeUrl = QRCodeNFCeGenerator.generate(
      accessKey,
      tpAmb,
      dhEmi,
      vNF,
      digVal,
      venda.empresa,
      fiscalConfig,
      customerCpf
    )

    const urlChaveBase = QRCodeNFCeGenerator.getConsultaUrl(venda.empresa.state, tpAmb)
    // urlChave = apenas a URL base de consulta (sem ?chNFe=...) — XSD maxLength=85
    const urlChave = urlChaveBase

    // Escapa & → &amp; para XML válido (CDATA não é aceito pelo XSD da SEFAZ)
    const qrCodeXmlSafe = qrCodeUrl.replace(/&/g, '&amp;')
    const urlChaveXmlSafe = urlChave.replace(/&/g, '&amp;')

    const suplementalXml =
      `<infNFeSupl>` +
      `<qrCode>${qrCodeXmlSafe}</qrCode>` +
      `<urlChave>${urlChaveXmlSafe}</urlChave>` +
      `</infNFeSupl>`

    if (this.shouldLogPayload()) {
      cloudLogger.info('FISCAL_NFCE_SUPPLEMENTAL_INFO', {
        accessKey,
        tpAmb,
        dhEmi,
        vNF,
        digValPreview: digVal.slice(0, 16),
        qrCodeUrl,
        qrCodeXmlSafe,
        urlChave,
        suplementalXml: suplementalXml.slice(0, 300),
      })
    }

    if (signedXml.includes('<Signature')) {
      return signedXml.replace('<Signature', `${suplementalXml}<Signature`)
    }

    return signedXml.replace('</NFe>', `${suplementalXml}</NFe>`)
  }

  private async validateWithXsdIfEnabled(xmlContent: string): Promise<void> {
    if (!FiscalXsdValidator.shouldValidate()) {
      logger.info('[FISCAL_XSD] Validação XSD desabilitada; pulando')
      return
    }

    logger.info('[FISCAL_XSD] Iniciando validação XSD')
    try {
      const result = await FiscalXsdValidator.validate(xmlContent)
      logger.info(
        { isValid: result.isValid, errorCount: result.errors.length },
        '[FISCAL_XSD] Validação concluída'
      )
      if (!result.isValid) {
        throw new Error(`XML inválido no schema XSD: ${result.errors.join('; ')}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error({ error: message }, '[FISCAL_XSD] Erro na validação')
      if (this.isXsdInfraError(message)) {
        logger.warn(
          { error: message },
          '[FISCAL_XSD] Falha de infraestrutura; seguindo sem validar'
        )
        cloudLogger.warn('FISCAL_XSD_INFRA_FALLBACK', { error: message })
        return
      }
      throw error
    }
  }

  private isXsdInfraError(message: string): boolean {
    const normalized = message.toLowerCase()
    return [
      'xsd_path',
      'não configurado',
      'dependência libxmljs2 ausente',
      'download falhou',
      'url vazio',
      'invalid url',
      'enoent',
      'timeout',
    ].some((fragment) => normalized.includes(fragment))
  }

  private shouldLogPayload(): boolean {
    const raw = process.env.FISCAL_SEFAZ_LOG_PAYLOAD
    if (!raw) {
      return false
    }
    return ['1', 'true', 'yes', 'on', 'full'].includes(raw.toLowerCase())
  }
}
