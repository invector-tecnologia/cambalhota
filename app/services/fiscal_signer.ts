import forge from 'node-forge'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs/promises'
import { SignedXml } from 'xml-crypto'
import R2CertificateService from '#services/r2_certificate_service'
import FiscalXMLValidator from '#services/fiscal_xml_validator'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'

/**
 * Responsável por assinar o XML com o certificado A1 da empresa
 * Usa node-forge e xml-crypto para manipulação segura do certificado
 */
export default class FiscalSigner {
  /**
   * Assina um XML com o certificado PFX da empresa
   * Inclui validação antes e depois da assinatura
   */
  static async signXml(
    xmlContent: string,
    certificatePath: string,
    certificatePassword: string,
    validateBeforeSigning: boolean = true
  ): Promise<string> {
    const validator = new FiscalXMLValidator()

    // 1. VALIDAÇÃO PRÉ-ASSINATURA
    if (validateBeforeSigning) {
      logger.info('[FiscalSigner] Iniciando validação pré-assinatura')
      const preValidation = validator.validateUnsignedXML(xmlContent)

      if (!preValidation.isValid) {
        const report = FiscalXMLValidator.generateReport(preValidation)
        const xmlSize = Buffer.byteLength(xmlContent, 'utf8')
        const xmlSha256 = crypto.createHash('sha256').update(xmlContent).digest('hex')
        const xmlPreview = xmlContent.slice(0, 1000)
        const xmlTail = xmlContent.slice(-1000)

        const payloadMeta = {
          xmlSize,
          xmlSha256,
          xmlPreview,
          xmlTail,
          errors: preValidation.errors,
          warnings: preValidation.warnings,
        }

        logger.error('[FiscalSigner] XML inválido antes da assinatura:\n' + report)
        logger.error(payloadMeta, '[FiscalSigner] XML_PREVALIDATION_FAILED')
        cloudLogger.error('FISCAL_XML_PREVALIDATION_FAILED', payloadMeta)

        if (this.shouldLogPayload()) {
          cloudLogger.error('FISCAL_XML_PREVALIDATION_PAYLOAD', {
            ...payloadMeta,
            xmlContent,
          })
        }
        throw new Error(
          `XML inválido antes da assinatura. Erros: ${preValidation.errors
            .map((e) => `[${e.code}] ${e.message}`)
            .join('; ')}`
        )
      }

      logger.info('[FiscalSigner] ✓ XML passou na validação pré-assinatura')
    }

    let localCertPath = certificatePath
    const isR2Certificate = certificatePath.startsWith('certificados/')

    try {
      // 2. CARREGAMENTO E EXTRAÇÃO DO CERTIFICADO
      if (isR2Certificate) {
        logger.info(`[FiscalSigner] Baixando certificado do R2: ${certificatePath}`)
        localCertPath = await R2CertificateService.downloadCertificateTemp(certificatePath)
      }

      // Lê o arquivo PFX
      const pfxData = await fs.readFile(localCertPath)
      if (!pfxData.length) {
        throw new Error('Certificado PFX vazio')
      }

      // Converte PFX para formato legível pelo node-forge
      const p12 = forge.asn1.fromDer(pfxData.toString('binary'), false)
      const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12, false, certificatePassword)

      // Extrai as chaves do certificado
      const keyBags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })

      const privateKeyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
      const certificateBag = certBags[forge.pki.oids.certBag]?.[0]

      if (!privateKeyBag?.key || !certificateBag?.cert) {
        throw new Error('Certificado inválido ou senha incorreta')
      }

      const privateKey = privateKeyBag.key
      const certificate = certificateBag.cert

      // 3. CRIAÇÃO DA ASSINATURA
      logger.info('[FiscalSigner] Criando assinatura XMLDSig (RSA-SHA256)')

      const privateKeyPem = forge.pki.privateKeyToPem(privateKey)
      const certificatePem = forge.pki.certificateToPem(certificate)

      if (!privateKeyPem || !privateKeyPem.includes('PRIVATE KEY')) {
        throw new Error('Chave privada ausente ou invalida no PFX')
      }

      if (!certificatePem || !certificatePem.includes('BEGIN CERTIFICATE')) {
        throw new Error('Certificado digital ausente ou invalido no PFX')
      }

      let normalizedPrivateKeyPem = privateKeyPem
      try {
        const keyObject = crypto.createPrivateKey({ key: privateKeyPem })
        normalizedPrivateKeyPem = keyObject.export({ type: 'pkcs8', format: 'pem' }).toString()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Falha ao normalizar chave privada: ${errorMessage}`)
      }

      if (!normalizedPrivateKeyPem || !normalizedPrivateKeyPem.includes('PRIVATE KEY')) {
        throw new Error('Chave privada normalizada invalida')
      }

      const keyHeader = privateKeyPem.split('\n')[0]
      const normalizedKeyHeader = normalizedPrivateKeyPem.split('\n')[0]
      logger.info(
        {
          certificatePath,
          localCertPath,
          pfxSize: pfxData.length,
          privateKeySize: privateKeyPem.length,
          normalizedKeySize: normalizedPrivateKeyPem.length,
          certificateSize: certificatePem.length,
          keyHeader,
          normalizedKeyHeader,
        },
        '[FiscalSigner] Certificado carregado com sucesso'
      )

      let signedXml: string
      try {
        signedXml = this.signXmlWithXmlCrypto(xmlContent, normalizedPrivateKeyPem, certificatePem)
      } catch (signError) {
        const errorMessage = signError instanceof Error ? signError.message : 'Erro desconhecido'
        throw new Error(`Falha ao computar assinatura: ${errorMessage}`)
      }

      // 5. VALIDAÇÃO PÓS-ASSINATURA
      logger.info('[FiscalSigner] Iniciando validação pós-assinatura')
      const postValidation = validator.validateSignedXML(signedXml)

      if (!postValidation.isValid) {
        const report = FiscalXMLValidator.generateReport(postValidation)
        logger.error('[FiscalSigner] XML inválido após a assinatura:\n' + report)
        throw new Error(
          `XML inválido após assinatura. Erros: ${postValidation.errors
            .map((e) => `[${e.code}] ${e.message}`)
            .join('; ')}`
        )
      }

      logger.info('[FiscalSigner] ✓ XML passou na validação pós-assinatura')
      logger.info('[FiscalSigner] ✓ XML pronto para transmissão ao SEFAZ')

      return signedXml
    } catch (error) {
      throw new Error(`Erro ao assinar XML: ${(error as Error).message}`)
    } finally {
      // Limpa arquivo temporário se foi baixado do R2
      if (isR2Certificate && localCertPath !== certificatePath) {
        await R2CertificateService.cleanupTempCertificate(localCertPath)
      }
    }
  }

  /**
   * Anexa o bloco de assinatura ao XML
   * Simplificado para exemplo; em produção, usar xml-crypto completo
   */
  private static signXmlWithXmlCrypto(
    xmlContent: string,
    privateKeyPem: string,
    certificatePem: string
  ): string {
    const idMatch = xmlContent.match(/<(?:\w+:)?infNFe\b[^>]*\bId=["']([^"']+)["']/i)
    const referenceUri = idMatch ? `#${idMatch[1]}` : ''
    if (!referenceUri) {
      logger.warn('[FiscalSigner] Reference URI vazio; verifique Id do infNFe')
    }

    const signer = new SignedXml()
    // XSD xmldsig-core-schema_v1.01.xsd exige algoritmos fixos (SHA-1 + C14N):
    //   CanonicalizationMethod: http://www.w3.org/TR/2001/REC-xml-c14n-20010315
    //   SignatureMethod:        http://www.w3.org/2000/09/xmldsig#rsa-sha1
    //   DigestMethod:           http://www.w3.org/2000/09/xmldsig#sha1
    //   Transforms:             enveloped-signature + REC-xml-c14n-20010315
    signer.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
    signer.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
    signer.addReference({
      xpath: "//*[local-name()='infNFe']",
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      ],
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      uri: referenceUri,
    })
    signer.privateKey = privateKeyPem
    signer.publicCert = certificatePem

    signer.computeSignature(xmlContent, {
      location: { reference: "//*[local-name()='NFe']", action: 'append' },
    } as any)

    return signer.getSignedXml()
  }

  private static shouldLogPayload(): boolean {
    const raw = process.env.FISCAL_SEFAZ_LOG_PAYLOAD
    if (!raw) {
      return false
    }
    return ['1', 'true', 'yes', 'on', 'full'].includes(raw.toLowerCase())
  }
}
