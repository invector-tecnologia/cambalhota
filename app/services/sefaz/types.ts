export interface SefazWebserviceConfig {
  homologation: boolean
  state: string
  certificatePath: string
  certificatePassword: string
}

export interface SefazResponse {
  accessKey?: string
  protocolNumber?: string
  status?: number
  message?: string
  error?: string
  /** Resposta bruta da SEFAZ para diagnóstico */
  rawResponse?: string
}
