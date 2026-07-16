import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import https from 'node:https'
import AdmZip from 'adm-zip'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'

interface XsdValidationResult {
  isValid: boolean
  errors: string[]
}

export default class FiscalXsdValidator {
  static shouldValidate(): boolean {
    const raw = process.env.FISCAL_SEFAZ_XSD_VALIDATE
    if (!raw) {
      return false
    }
    return ['1', 'true', 'yes', 'on', 'full'].includes(raw.toLowerCase())
  }

  static async validate(xmlContent: string): Promise<XsdValidationResult> {
    if (!this.shouldValidate()) {
      return { isValid: true, errors: [] }
    }

    const rawTimeout = process.env.FISCAL_SEFAZ_XSD_TIMEOUT_MS
    const timeoutMs = rawTimeout ? Number(rawTimeout) : Number.NaN
    const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000

    const runValidation = async (): Promise<XsdValidationResult> => {
      const xsdPath = await this.resolveXsdPath()
      if (!xsdPath) {
        throw new Error('FISCAL_SEFAZ_XSD_PATH não configurado para validação XSD')
      }

      let libxml: any
      try {
        libxml = await import('libxmljs2')
      } catch (error) {
        throw new Error('Dependência libxmljs2 ausente para validação XSD')
      }

      const [xsdContent, xmlString] = await Promise.all([
        fs.readFile(xsdPath, 'utf8'),
        Promise.resolve(xmlContent),
      ])

      const xsdDoc = libxml.parseXml(xsdContent)
      const xmlDoc = libxml.parseXml(xmlString)

      const isValid = xmlDoc.validate(xsdDoc)
      const errors = (xmlDoc.validationErrors || []).map((err: any) => err.message || String(err))

      if (!isValid) {
        logger.error({ errors, xsdPath }, '[FISCAL_XSD] XML inválido no schema')
        cloudLogger.error('FISCAL_XSD_INVALID', { errors, xsdPath })
      } else {
        logger.info({ xsdPath }, '[FISCAL_XSD] XML validado com sucesso')
      }

      return { isValid, errors }
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Validação XSD excedeu timeout de ${effectiveTimeoutMs}ms`)),
        effectiveTimeoutMs
      )
    })

    return Promise.race([runValidation(), timeoutPromise])
  }

  private static async resolveXsdPath(): Promise<string | null> {
    const envPath = process.env.FISCAL_SEFAZ_XSD_PATH
    if (envPath) {
      const exists = await this.fileExists(envPath)
      if (exists) {
        return envPath
      }
    }

    await this.ensureXsdFromUrl()

    const markerPath = path.resolve('resources', 'xsd', '.xsd_path')
    const markerExists = await this.fileExists(markerPath)
    if (markerExists) {
      const content = await fs.readFile(markerPath, 'utf8')
      const resolved = content.trim()
      if (resolved && (await this.fileExists(resolved))) {
        return resolved
      }
    }

    return envPath || null
  }

  private static async ensureXsdFromUrl(): Promise<void> {
    const rawUrl = process.env.FISCAL_SEFAZ_XSD_URL
    if (!rawUrl) {
      return
    }

    const url = rawUrl.trim()
    if (!url) {
      return
    }

    const targetDir = path.resolve('resources', 'xsd')
    const urlMarker = path.join(targetDir, '.xsd_url')

    const markerValue = await this.readFileSafe(urlMarker)
    if (markerValue && markerValue.trim() === url) {
      return
    }

    await fs.mkdir(targetDir, { recursive: true })
    const normalizedUrl = this.normalizeUrl(url)
    const filename = path.basename(new URL(normalizedUrl).pathname) || 'nfe_v4.00.xsd'
    const tempPath = path.join(targetDir, filename)

    await this.downloadFile(normalizedUrl, tempPath)

    if (filename.toLowerCase().endsWith('.zip')) {
      const zip = new AdmZip(tempPath)
      zip.extractAllTo(targetDir, true)
      await fs.unlink(tempPath)
    }

    const mainXsd = await this.findMainXsd(targetDir)
    if (mainXsd) {
      await fs.writeFile(path.join(targetDir, '.xsd_path'), mainXsd, 'utf8')
      await fs.writeFile(urlMarker, url, 'utf8')
    }
  }

  private static async downloadFile(url: string, destPath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const resolvedUrl = this.normalizeUrl(url)
      const request = https.get(resolvedUrl, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
          const location = response.headers.location
          if (location) {
            response.resume()
            this.downloadFile(location, destPath).then(resolve).catch(reject)
            return
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download falhou (${response.statusCode}) para ${resolvedUrl}`))
          return
        }

        fs.open(destPath, 'w')
          .then((handle) => {
            const stream = handle.createWriteStream()
            response.pipe(stream)
            stream.on('finish', async () => {
              await handle.close()
              resolve()
            })
            stream.on('error', async (err) => {
              await handle.close()
              reject(err)
            })
          })
          .catch(reject)
      })

      request.on('error', reject)
    })
  }

  private static normalizeUrl(rawUrl: string): string {
    if (!rawUrl) {
      throw new Error('URL vazio para download')
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl
    }
    return `https://www.nfe.fazenda.gov.br${rawUrl}`
  }

  private static async findMainXsd(targetDir: string): Promise<string | null> {
    const entries = await fs.readdir(targetDir, { withFileTypes: true })
    const xsdFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.xsd'))
    const preferred = xsdFiles.find((entry) => entry.name.toLowerCase() === 'nfe_v4.00.xsd')
    if (preferred) {
      return path.join(targetDir, preferred.name)
    }
    if (xsdFiles.length > 0) {
      return path.join(targetDir, xsdFiles[0].name)
    }
    return null
  }

  private static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  private static async readFileSafe(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf8')
    } catch {
      return null
    }
  }
}
