import type { HttpContext } from '@adonisjs/core/http'
import Empresa from '#models/empresa'

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
import vine from '@vinejs/vine'

export default class PrintConfigController {
  /**
   * Exibe a página de configurações de impressão
   */
  async index({ view, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    logger.info(`[PRINT CONFIG] User ${user.id} accessing print configuration`)

    const empresa = await Empresa.findOrFail(user.empresaId)

    return view.render('print-config/index', { empresa })
  }

  /**
   * Atualiza as configurações de impressão
   */
  async update({ request, response, session, auth, logger }: HttpContext) {
    const updateSchema = vine.object({
      nota_fiscal_footer_message: vine.string().trim().optional(),
      remove_logo: vine.string().optional(),
      document_type: vine.enum(['cpf', 'cnpj']).optional(),
      cnpj: vine.string().trim().optional(),
      cpf: vine.string().trim().optional(),
    })

    try {
      const data = await vine.validate({
        schema: updateSchema,
        data: request.all(),
      })

      const user = await auth.authenticate()
      const empresa = await Empresa.findOrFail(user.empresaId)

      logger.info(
        `[PRINT CONFIG UPDATE] User ${user.id} updating print config for empresa ${empresa.id}`
      )

      // Atualizar mensagem de rodapé
      if (data.nota_fiscal_footer_message !== undefined) {
        empresa.notaFiscalFooterMessage = data.nota_fiscal_footer_message || null
      }

      // Atualizar documento (CPF/CNPJ)
      if (data.document_type) {
        empresa.documentType = data.document_type as any

        if (data.document_type === 'cnpj') {
          const raw = (data.cnpj || '').replace(/\D/g, '')
          if (!raw || raw.length !== 14 || !this.isValidCNPJ(raw)) {
            session.flash('error', 'CNPJ inválido.')
            return response.redirect().back()
          }
          empresa.cnpj = raw
          empresa.cpf = null
        } else {
          const raw = (data.cpf || '').replace(/\D/g, '')
          if (!raw || raw.length !== 11 || !this.isValidCPF(raw)) {
            session.flash('error', 'CPF inválido.')
            return response.redirect().back()
          }
          empresa.cpf = raw
          empresa.cnpj = null
        }
      }

      // Processar upload da logo (Cloudflare Images)
      const logoFile = request.file('logo', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (logoFile && logoFile.tmpPath) {
        try {
          const cloudflareImagesModule = await import('#services/cloudflare_images_service')
          const CloudflareImagesService = cloudflareImagesModule.default
          const cf = new CloudflareImagesService()
          // Se já existe uma logo na Cloudflare, remover para não deixar órfãos
          if (empresa.logoUrl) {
            try {
              const del = await cf.deleteImageByUrl(empresa.logoUrl)
              if (del?.notFound) {
                logger.info(
                  `[PRINT CONFIG UPDATE] Logo anterior já não existia no Cloudflare (${empresa.logoUrl})`
                )
              } else {
                logger.info(
                  `[PRINT CONFIG UPDATE] Logo anterior removida da Cloudflare (${empresa.logoUrl})`
                )
              }
            } catch (deleteErr) {
              logger.warn(
                `[PRINT CONFIG UPDATE] Falha ao remover logo antiga da Cloudflare: ${deleteErr}`
              )
            }
          }
          const logoFilename = logoFile.clientName
          const nameSlug = empresa?.razaoSocial
            ? slugify(empresa.razaoSocial)
            : `emp-${user.empresaId}`
          const ext = logoFilename.includes('.') ? logoFilename.split('.').pop() : 'img'
          const customId = `emp-${user.empresaId}-${nameSlug}-logo-${Date.now()}.${ext}`
          const result = await cf.uploadFile(logoFile.tmpPath, logoFilename, logoFile.type, {
            customId,
          })

          empresa.logoUrl = result.url

          logger.info(
            `[PRINT CONFIG UPDATE] Logo uploaded to CF: ${logoFilename} url=${result.url}`
          )
        } catch (err) {
          logger.error(`[PRINT CONFIG UPDATE] Falha no upload da logo para Cloudflare: ${err}`)
        }
      }

      // Remover logo se solicitado
      if (data.remove_logo === 'true') {
        try {
          const cloudflareImagesModule = await import('#services/cloudflare_images_service')
          const CloudflareImagesService = cloudflareImagesModule.default
          const cf = new CloudflareImagesService()
          if (empresa.logoUrl) {
            const del = await cf.deleteImageByUrl(empresa.logoUrl)
            if (del?.notFound) {
              logger.info(
                `[PRINT CONFIG UPDATE] Logo já não existia no Cloudflare (${empresa.logoUrl}), apenas limpei o banco`
              )
            } else {
              logger.info(
                `[PRINT CONFIG UPDATE] Logo removida do Cloudflare (${empresa.logoUrl}) por solicitação do usuário`
              )
            }
          }
        } catch (err) {
          logger.warn(`[PRINT CONFIG UPDATE] Falha ao remover logo no Cloudflare: ${err}`)
        }

        empresa.logoUrl = null
        logger.info(`[PRINT CONFIG UPDATE] Logo removed`)
      }

      await empresa.save()

      session.flash('success', 'Configurações de impressão atualizadas com sucesso!')
      return response.redirect().toRoute('print-config.index')
    } catch (error) {
      logger.error(`[PRINT CONFIG UPDATE] Error: ${error.message}`)
      session.flash('error', 'Erro ao atualizar configurações de impressão.')
      return response.redirect().back()
    }
  }

  /**
   * Serve a imagem da logo da empresa (redireciona para CDN ou retorna 404)
   */
  async logo({ response, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const empresa = await Empresa.findOrFail(user.empresaId)

      logger.info(
        `[PRINT CONFIG LOGO] User ${user.id} requesting logo for empresa ${empresa.id}. logoUrl: ${empresa.logoUrl}`
      )

      if (empresa.logoUrl) {
        response.header('Cache-Control', 'public, max-age=31536000')
        response.header('Access-Control-Allow-Origin', '*')
        return response.redirect(empresa.logoUrl)
      }

      logger.warn(`[PRINT CONFIG LOGO] No logo found for empresa ${empresa.id}`)
      return response.status(404).send('Logo não encontrada')
    } catch (error) {
      logger.error(`[PRINT CONFIG LOGO] Error: ${error.message}`)
      return response.status(404).send('Logo não encontrada')
    }
  }

  private isValidCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    let sum = 0
    let remainder = 0

    for (let i = 1; i <= 9; i++) {
      sum += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(cpf.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(cpf.substring(10, 11))) return false

    return true
  }

  private isValidCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

    let size = cnpj.length - 2
    let numbers = cnpj.substring(0, size)
    let digits = cnpj.substring(size)
    let sum = 0
    let pos = 0

    for (let i = size - 1; i >= 0; i--) {
      sum += Number.parseInt(numbers.charAt(size - 1 - i)) * Math.pow(10, pos % 8)
      if (pos % 8 === 7) sum -= sum % 11 < 2 ? 0 : sum % 11
      pos++
    }

    if (sum % 11 < 2 && digits.charAt(0) === '0') {
      sum = 0
      size = size + 1
      numbers = cnpj.substring(0, size)

      for (let i = size - 1; i >= 0; i--) {
        sum += Number.parseInt(numbers.charAt(size - 1 - i)) * Math.pow(10, pos % 8)
        if (pos % 8 === 7) sum -= sum % 11 < 2 ? 0 : sum % 11
        pos++
      }

      if (sum % 11 < 2 && digits.charAt(1) === '0') return true
    }

    return false
  }
}
