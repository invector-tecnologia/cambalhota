import type { HttpContext } from '@adonisjs/core/http'

export default class ImagesController {
  /**
   * Testa upload para Cloudflare Images gerando uma imagem PNG 1x1 válida
   */
  async testUpload({ response, logger, auth }: HttpContext) {
    await auth.authenticate()

    try {
      const tmpPath = '/tmp/tavolo_cf_test.png'
      const filename = 'tavolo_cf_test.png'
      const mime = 'image/png'

      // PNG 1x1 válido (base64 conhecido)
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8/5+hHgAHggJ/PdLVLwAAAABJRU5ErkJggg=='
      const pngBuffer = Buffer.from(pngBase64, 'base64')

      const fs = await import('node:fs/promises')
      await fs.writeFile(tmpPath, pngBuffer)

      const cfModule = await import('#services/cloudflare_images_service')
      const CloudflareImagesService = cfModule.default
      const cf = new CloudflareImagesService()
      const result = await cf.uploadFile(tmpPath, filename, mime)

      logger.info(`[CF IMAGES TEST] id=${result.imageId} url=${result.url}`)

      return response.json({ success: true, imageId: result.imageId, url: result.url })
    } catch (error: any) {
      const safe = {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      }
      logger.error(`[CF IMAGES TEST ERROR] ${JSON.stringify(safe)}`)
      return response.status(500).json({ success: false, ...safe })
    }
  }

  /**
   * Verifica se as variáveis de ambiente da Cloudflare estão presentes
   */
  async env({ response, auth }: HttpContext) {
    await auth.authenticate()
    const cfModule = await import('#services/cloudflare_images_service')
    const CloudflareImagesService = cfModule.default
    let diagnostics = {}
    try {
      const cf = new CloudflareImagesService()
      diagnostics = cf.getDiagnostics()
    } catch (err: any) {
      diagnostics = { error: err.message }
    }
    return response.json({ ok: true, diagnostics })
  }
}
