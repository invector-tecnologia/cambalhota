import { access } from 'node:fs/promises'
import * as fs from 'node:fs/promises'
import R2CertificateService from '#services/r2_certificate_service'

export default class FiscalCertificateUploader {
  static async uploadFromRequest(
    certificate: {
      extname?: string
      hasErrors: boolean
      errors?: Array<{ message: string }>
      move: any
    },
    establishmentId: number,
    cnpj: string
  ): Promise<string> {
    if (!certificate) {
      throw new Error('Certificado digital é obrigatório')
    }

    const fileName = `cert_temp_${establishmentId}_${Date.now()}.${certificate.extname}`
    await certificate.move('uploads/certificates', { name: fileName })

    if (certificate.hasErrors) {
      const moveErrors = certificate.errors?.map((err) => err.message).join(', ')
      throw new Error(`Falha ao salvar certificado: ${moveErrors || 'erro desconhecido'}`)
    }

    const tempCertificatePath = `uploads/certificates/${fileName}`

    try {
      await access(tempCertificatePath)
    } catch {
      throw new Error(`Certificado não encontrado após upload: ${tempCertificatePath}`)
    }

    try {
      const r2Result = await R2CertificateService.uploadCertificate(tempCertificatePath, cnpj)
      return r2Result.key
    } finally {
      try {
        await fs.unlink(tempCertificatePath)
      } catch {
        // ignore temp cleanup errors
      }
    }
  }
}
