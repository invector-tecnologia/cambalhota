import axios from 'axios'

interface UploadResult {
  imageId: string
  variants: string[]
  url: string
}

interface UploadOptions {
  customId?: string
}

interface DeleteResult {
  success: boolean
  notFound?: boolean
  status?: number
  result?: any
}

export default class CloudflareImagesService {
  private accountId: string
  private apiToken: string
  private deliveryBase?: string
  private defaultVariant?: string

  constructor() {
    this.accountId = (process.env.CF_IMAGES_ACCOUNT_ID || '').trim()
    this.apiToken = (process.env.CF_IMAGES_API_TOKEN || '').trim()
    this.deliveryBase = process.env.CF_IMAGES_DELIVERY_BASE
    this.defaultVariant = process.env.CF_IMAGES_DEFAULT_VARIANT || 'public'

    if (!this.accountId || !this.apiToken) {
      throw new Error(
        'Cloudflare Images não configurado: defina CF_IMAGES_ACCOUNT_ID e CF_IMAGES_API_TOKEN'
      )
    }
  }

  /**
   * Remove uma imagem no Cloudflare Images a partir do imageId
   */
  async deleteImage(imageId: string): Promise<DeleteResult> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${imageId}`

    let res
    try {
      res = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        validateStatus: () => true,
      })
    } catch (err: any) {
      const status = err?.response?.status
      const data = err?.response?.data
      const message = err?.message || 'Axios error'
      throw new Error(
        `CF Images delete axios error | status=${status} | message=${message} | data=${JSON.stringify(
          data
        )}`
      )
    }

    if (res?.data?.success) {
      return { success: true, status: res?.status, result: res.data?.result }
    }

    // Tolerar not found (404 / código 5404) para não travar fluxo de exclusão
    const isNotFoundStatus = res?.status === 404
    const hasNotFoundCode = Array.isArray(res?.data?.errors)
      ? res.data.errors.some((e: any) => e?.code === 5404 || e?.message?.includes('not found'))
      : false

    if (isNotFoundStatus || hasNotFoundCode) {
      return { success: false, notFound: true, status: res?.status, result: res?.data }
    }

    throw new Error(
      `CF Images delete failed | status=${res?.status} | data=${JSON.stringify(res?.data)}`
    )
  }

  /**
   * Remove imagem a partir da URL (extrai o imageId do caminho)
   */
  async deleteImageByUrl(imageUrl: string): Promise<DeleteResult> {
    const imageId = this.extractImageId(imageUrl)
    if (!imageId) {
      throw new Error(`Não foi possível extrair imageId da URL fornecida: ${imageUrl}`)
    }
    return this.deleteImage(imageId)
  }

  /**
   * Retorna diagnóstico sem expor o token
   */
  getDiagnostics(): Record<string, any> {
    const tokenLength = this.apiToken.length
    const tokenStart = this.apiToken.substring(0, 8)
    const tokenEnd = this.apiToken.substring(Math.max(0, this.apiToken.length - 8))
    return {
      accountIdPresent: !!this.accountId,
      accountIdLength: this.accountId.length,
      tokenPresent: !!this.apiToken,
      tokenLength,
      tokenStartsWith: `${tokenStart}...`,
      tokenEndsWith: `...${tokenEnd}`,
      deliveryBasePresent: !!this.deliveryBase,
      defaultVariant: this.defaultVariant,
    }
  }

  async uploadFile(
    filePath: string,
    filename: string,
    mimeType?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const formDataModule = await import('form-data')
    const FormData = formDataModule.default
    const fs = await import('node:fs')

    const form = new FormData()
    form.append('file', fs.createReadStream(filePath), {
      filename,
      contentType: mimeType || 'application/octet-stream',
    })

    if (options?.customId) {
      form.append('id', options.customId)
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`

    let res
    try {
      res = await axios.post(url, form, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        validateStatus: () => true,
      })
    } catch (err: any) {
      const status = err?.response?.status
      const data = err?.response?.data
      const message = err?.message || 'Axios error'
      throw new Error(
        `CF Images upload axios error | status=${status} | message=${message} | data=${JSON.stringify(
          data
        )}`
      )
    }

    if (!res?.data?.success) {
      throw new Error(
        `CF Images upload failed | status=${res?.status} | data=${JSON.stringify(res?.data)}`
      )
    }

    const result = res.data.result
    const variants: string[] = result.variants || []
    const imageId: string = result.id

    const urlChoice = this.pickVariantUrl(imageId, variants)

    return { imageId, variants, url: urlChoice }
  }

  private pickVariantUrl(imageId: string, variants: string[]): string {
    // Preferir variante padrão configurada
    if (this.deliveryBase && this.defaultVariant) {
      return `${this.deliveryBase}/${imageId}/${this.defaultVariant}`
    }

    // Caso não haja base/variant configurados, usar primeiro variant retornado
    if (variants && variants.length > 0) {
      // Priorizar variant que contenha '/public'
      const publicVariant = variants.find((v) => v.includes('/public'))
      return publicVariant || variants[0]
    }

    // Fallback absoluto: entregar ID sem variant (não recomendado)
    if (this.deliveryBase) {
      return `${this.deliveryBase}/${imageId}/public`
    }

    throw new Error('Nenhuma variante disponível para a imagem e delivery base ausente')
  }

  /**
   * Extrai o imageId de uma URL do Cloudflare Images
   * Formato: https://imagedelivery.net/<accountHash>/<imageId>/<variant>
   */
  private extractImageId(imageUrl: string): string | null {
    try {
      const urlObj = new URL(imageUrl)
      const parts = urlObj.pathname.split('/').filter(Boolean)
      // Formato esperado: /<accountHash>/<imageId>/<variant>
      // Retornar parts[1] que é o imageId (ou customId se foi usado)
      if (parts.length >= 2) {
        return parts[1]
      }
      return null
    } catch (err) {
      return null
    }
  }
}
