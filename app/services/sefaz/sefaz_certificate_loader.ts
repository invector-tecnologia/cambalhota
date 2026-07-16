import * as fs from 'node:fs/promises'
import tls from 'node:tls'
import forge from 'node-forge'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'
import R2CertificateService from '#services/r2_certificate_service'
import type { SefazWebserviceConfig } from './types.js'

export default class SefazCertificateLoader {
  constructor(private readonly config: SefazWebserviceConfig) {}

  async load(): Promise<{ cert: string; key: string; ca?: string[] }> {
    let localCertPath = this.config.certificatePath
    const isR2Certificate = this.config.certificatePath.startsWith('certificados/')
    let tempCertPath: string | null = null

    try {
      if (isR2Certificate) {
        logger.info(
          `[FiscalTransmitter] Baixando certificado do R2: ${this.config.certificatePath}`
        )
        localCertPath = await R2CertificateService.downloadCertificateTemp(
          this.config.certificatePath
        )
        tempCertPath = localCertPath
      }

      const pfxData = await fs.readFile(localCertPath)
      const p12 = forge.asn1.fromDer(pfxData.toString('binary'), false)
      const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12, false, this.config.certificatePassword)

      const keyBags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })

      const privateKeyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
      const certificateBag = certBags[forge.pki.oids.certBag]?.[0]
      const certificateChain = certBags[forge.pki.oids.certBag] || []

      if (!privateKeyBag?.key || !certificateBag?.cert) {
        throw new Error('Certificado inválido ou senha incorreta')
      }

      const privateKeyPem = forge.pki.privateKeyToPem(privateKeyBag.key)
      const certificatePem = forge.pki.certificateToPem(certificateBag.cert)
      const caChain = certificateChain
        .map((bag) => bag.cert)
        .filter((cert): cert is forge.pki.Certificate => Boolean(cert))
        .map((cert) => forge.pki.certificateToPem(cert))
        .filter((pem) => pem !== certificatePem)

      const extraCa = await this.loadExtraCaBundle()
      const mergedCa = this.mergeCaChains(caChain, extraCa)
      const finalCa = this.appendSystemCa(mergedCa)

      if (caChain.length > 0) {
        logger.info(
          { chainLength: caChain.length },
          '[FiscalTransmitter] Cadeia de certificados carregada'
        )
      }

      if (tempCertPath) {
        await R2CertificateService.cleanupTempCertificate(tempCertPath)
      }

      return {
        cert: certificatePem,
        key: privateKeyPem,
        ca: finalCa.length > 0 ? finalCa : undefined,
      }
    } catch (error) {
      if (tempCertPath) {
        await R2CertificateService.cleanupTempCertificate(tempCertPath)
      }
      throw new Error(
        `Erro ao carregar certificado para MTLS: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private mergeCaChains(primary: string[], extra?: string[]): string[] {
    if (!extra || extra.length === 0) {
      return primary
    }
    return [...primary, ...extra]
  }

  private appendSystemCa(chain: string[]): string[] {
    const systemCa = Array.from(tls.rootCertificates)
    if (!chain || chain.length === 0) {
      return systemCa
    }
    return [...chain, ...systemCa]
  }

  private async loadExtraCaBundle(): Promise<string[] | undefined> {
    const caPath = process.env.FISCAL_SEFAZ_CA_BUNDLE_PATH
    if (!caPath) {
      return undefined
    }

    let localPath = caPath
    let tempPath: string | null = null

    try {
      if (caPath.startsWith('certificados/')) {
        logger.info(`[FiscalTransmitter] Baixando CA do R2: ${caPath}`)
        localPath = await R2CertificateService.downloadCertificateTemp(caPath)
        tempPath = localPath
      }

      const caPem = await fs.readFile(localPath, 'utf8')
      const certs = this.splitPemBundle(caPem)

      logger.info(
        { count: certs.length, caPath },
        '[FiscalTransmitter] CA bundle adicional carregado'
      )
      cloudLogger.info('FISCAL_SEFAZ_CA_BUNDLE_LOADED', {
        count: certs.length,
        caPath,
      })

      return certs
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        '[FiscalTransmitter] Falha ao carregar CA bundle'
      )
      cloudLogger.error('FISCAL_SEFAZ_CA_BUNDLE_LOAD_FAILED', {
        error: error instanceof Error ? error.message : String(error),
        caPath,
      })
      return undefined
    } finally {
      if (tempPath) {
        await R2CertificateService.cleanupTempCertificate(tempPath)
      }
    }
  }

  private splitPemBundle(pem: string): string[] {
    const matches = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)
    if (matches && matches.length > 0) {
      return matches.map((cert) => cert.trim())
    }
    const trimmed = pem.trim()
    return trimmed ? [trimmed] : []
  }
}
