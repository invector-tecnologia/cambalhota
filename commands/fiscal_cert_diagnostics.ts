import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import * as fs from 'node:fs/promises'
import forge from 'node-forge'
import FiscalConfig from '#models/fiscal_config'
import R2CertificateService from '#services/r2_certificate_service'

const reportFatal = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.stack || error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error)
  console.error('[fiscal:cert:diagnose] Uncaught error:', message)
}

process.on('uncaughtException', reportFatal)
process.on('unhandledRejection', reportFatal)

/**
 * Diagnostico do certificado fiscal do estabelecimento
 * Uso: node ace fiscal:cert:diagnose --establishment-id=1
 * Uso: node ace fiscal:cert:diagnose --certificate-path=/path/arquivo.pfx --certificate-password=senha
 */
export default class FiscalCertDiagnostics extends BaseCommand {
  static commandName = 'fiscal:cert:diagnose'
  static description = 'Valida se o PFX contem chave privada e se a senha esta correta'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({ description: 'ID do estabelecimento' })
  declare establishmentId: number

  @flags.string({ description: 'Caminho do certificado (local ou chave R2)' })
  declare certificatePath: string

  @flags.string({ description: 'Senha do certificado' })
  declare certificatePassword: string

  async run() {
    try {
      let certificatePath = this.certificatePath
      let certificatePassword = this.certificatePassword

      if (!certificatePath || !certificatePassword) {
        const establishmentId = Number(this.establishmentId)

        if (!establishmentId || Number.isNaN(establishmentId)) {
          this.logger.error(
            'Informe --establishment-id ou use --certificate-path e --certificate-password.'
          )
          this.exitCode = 1
          return
        }

        const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

        if (!config) {
          this.logger.error(
            `Configuracao fiscal nao encontrada para establishment_id=${establishmentId}`
          )
          this.exitCode = 1
          return
        }

        certificatePath = config.certificatePath
        certificatePassword = config.getDecryptedCertificatePassword()
      }

      let localCertPath = certificatePath
      const isR2Certificate = certificatePath.startsWith('certificados/')

      try {
        if (isR2Certificate) {
          this.logger.info(`Baixando certificado do R2: ${certificatePath}`)
          localCertPath = await R2CertificateService.downloadCertificateTemp(certificatePath)
        }

        const pfxData = await fs.readFile(localCertPath)
        if (!pfxData.length) {
          throw new Error('PFX vazio no disco')
        }

        const p12 = forge.asn1.fromDer(pfxData.toString('binary'), false)
        const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12, false, certificatePassword)

        const shroudedKeyBags = pkcs12.getBags({
          bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
        })[forge.pki.oids.pkcs8ShroudedKeyBag]

        const keyBags = pkcs12.getBags({
          bagType: forge.pki.oids.keyBag,
        })[forge.pki.oids.keyBag]

        const certBags = pkcs12.getBags({
          bagType: forge.pki.oids.certBag,
        })[forge.pki.oids.certBag]

        const privateKeyBag = shroudedKeyBags?.[0] || keyBags?.[0]
        const certificateBag = certBags?.[0]

        const privateKeyPem = privateKeyBag?.key ? forge.pki.privateKeyToPem(privateKeyBag.key) : ''
        const certificatePem = certificateBag?.cert
          ? forge.pki.certificateToPem(certificateBag.cert)
          : ''

        this.logger.info('Diagnostico do certificado:')
        this.logger.info(`- Path: ${certificatePath}`)
        this.logger.info(`- R2: ${isR2Certificate ? 'sim' : 'nao'}`)
        this.logger.info(`- PFX size: ${pfxData.length} bytes`)
        this.logger.info(`- Private key bag: ${privateKeyBag ? 'sim' : 'nao'}`)
        this.logger.info(`- Certificate bag: ${certificateBag ? 'sim' : 'nao'}`)
        this.logger.info(
          `- Private key PEM: ${privateKeyPem.includes('BEGIN PRIVATE KEY') ? 'ok' : 'invalido'}`
        )
        this.logger.info(
          `- Certificate PEM: ${certificatePem.includes('BEGIN CERTIFICATE') ? 'ok' : 'invalido'}`
        )

        if (!privateKeyPem.includes('BEGIN PRIVATE KEY')) {
          this.logger.error('Chave privada ausente no PFX. Reenvie o certificado correto.')
          this.exitCode = 1
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.logger.error(`Falha no diagnostico do certificado: ${errorMessage}`)
        this.exitCode = 1
      } finally {
        if (isR2Certificate && localCertPath !== certificatePath) {
          await R2CertificateService.cleanupTempCertificate(localCertPath)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Erro inesperado no diagnostico: ${errorMessage}`)
      this.exitCode = 1
    }
  }
}
