import crypto from 'node:crypto'
import { getUFCode, cleanCNPJ, cleanCPF, formatMoneyForXML } from './fiscal_formatters.js'

/**
 * URLs de consulta NFC-e por UF
 * Fonte: Manual de Orientação do Contribuinte MOC 7.0
 */
export const QR_CODE_URLS: Record<string, string> = {
  // Região Sul
  PR: 'http://www.fazenda.pr.gov.br/nfce/qrcode',
  RS: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
  SC: 'https://sat.sef.sc.gov.br/nfce/consulta',

  // Região Sudeste
  ES: 'https://app.sefaz.es.gov.br/ConsultaNFCe',
  MG: 'http://nfce.fazenda.mg.gov.br/portalnfce',
  RJ: 'http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode',
  SP: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx',

  // Região Centro-Oeste
  DF: 'http://dec.fazenda.df.gov.br/ConsultarNFCe.aspx',
  GO: 'http://nfe.goias.gov.br/nfeweb/sites/nfce/danfeNFCe',
  MS: 'http://www.dfe.ms.gov.br/nfce/qrcode',
  MT: 'http://www.sefaz.mt.gov.br/nfce/consultanfce',

  // Região Nordeste
  AL: 'http://nfce.sefaz.al.gov.br/consultaNFCe.htm',
  BA: 'http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode/qrcode.aspx',
  CE: 'http://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html',
  MA: 'http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
  PB: 'http://www.receita.pb.gov.br/nfce',
  PE: 'http://nfce.sefaz.pe.gov.br/nfce/qrcode',
  PI: 'http://webas.sefaz.pi.gov.br/nfceweb/consultarNFCe.jsf',
  RN: 'http://nfce.set.rn.gov.br/consultarNFCe.aspx',
  SE: 'http://www.nfce.se.gov.br/portal/consultarNFCe.jsp',

  // Região Norte
  AC: 'http://www.sefaznet.ac.gov.br/nfce/qrcode',
  AM: 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp',
  AP: 'https://www.sefaz.ap.gov.br/nfce/consulta',
  PA: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/consultanfce.seam',
  RO: 'http://www.nfce.sefin.ro.gov.br',
  RR: 'https://www.sefaz.rr.gov.br/nfce/servlet/wp_consulta_nfce',
  TO: 'http://www.sefaz.to.gov.br/nfce/consultanfce.jsf',
}

/**
 * Interface para dados do QR Code
 */
interface QRCodeData {
  chaveAcesso: string // Chave de acesso de 44 dígitos
  uf: string // Sigla da UF
  tpAmb: '1' | '2' // 1=Produção, 2=Homologação
  cDest?: string // CPF/CNPJ do destinatário (opcional)
  dhEmi: string // Data/hora de emissão
  vNF: number // Valor total da NF-e
  vICMS: number // Valor do ICMS
  digVal: string // Digest Value (hash SHA-1 do XML assinado)
  cIdToken: string // CSC ID (Código de Segurança do Contribuinte)
  cscToken: string // CSC Token
}

/**
 * Gera o QR Code da NFC-e conforme Manual MOC 7.0
 *
 * O QR Code contém a URL de consulta da NFC-e seguida dos parâmetros:
 * - chNFe (chave de acesso)
 * - nVersao (versão)
 * - tpAmb (ambiente)
 * - cDest (CPF/CNPJ destinatário - opcional)
 * - dhEmi (data/hora emissão em hexadecimal)
 * - vNF (valor total)
 * - vICMS (valor ICMS)
 * - digVal (digest value em hexadecimal)
 * - cIdToken (ID do CSC)
 * - cHashQRCode (hash SHA-1)
 *
 * @param data Dados para gerar o QR Code
 * @returns URL completa do QR Code
 */
export function generateQRCode(data: QRCodeData): string {
  // URL base de consulta para a UF
  const baseUrl = QR_CODE_URLS[data.uf.toUpperCase()]
  if (!baseUrl) {
    throw new Error(`URL de consulta NFC-e não configurada para UF: ${data.uf}`)
  }

  // Converte data/hora para hexadecimal (formato compacto)
  const dhEmiHex = Buffer.from(data.dhEmi, 'utf8').toString('hex').toUpperCase()

  // Converte digest value para hexadecimal
  const digValHex = Buffer.from(data.digVal, 'utf8').toString('hex').toUpperCase()

  // Monta string para gerar hash
  // Formato: chNFe|nVersao|tpAmb|[cDest|]dhEmi|vNF|digVal|cIdToken|CSC
  let hashString = data.chaveAcesso
  hashString += '|2' // nVersao sempre 2 para QR Code versão 2
  hashString += `|${data.tpAmb}`
  if (data.cDest) {
    hashString += `|${cleanCNPJ(data.cDest) || cleanCPF(data.cDest)}`
  }
  hashString += `|${dhEmiHex}`
  hashString += `|${formatMoneyForXML(data.vNF)}`
  hashString += `|${digValHex}`
  hashString += `|${data.cIdToken}`
  hashString += `|${data.cscToken}`

  // Gera hash SHA-1
  const cHashQRCode = crypto
    .createHash('sha1')
    .update(hashString, 'utf8')
    .digest('hex')
    .toUpperCase()

  // Monta URL do QR Code
  let qrCodeUrl = `${baseUrl}?`
  qrCodeUrl += `chNFe=${data.chaveAcesso}`
  qrCodeUrl += `&nVersao=100` // Versão do QR Code (100 = versão 1.00)
  qrCodeUrl += `&tpAmb=${data.tpAmb}`
  if (data.cDest) {
    qrCodeUrl += `&cDest=${cleanCNPJ(data.cDest) || cleanCPF(data.cDest)}`
  }
  qrCodeUrl += `&dhEmi=${dhEmiHex}`
  qrCodeUrl += `&vNF=${formatMoneyForXML(data.vNF)}`
  qrCodeUrl += `&vICMS=${formatMoneyForXML(data.vICMS)}`
  qrCodeUrl += `&digVal=${digValHex}`
  qrCodeUrl += `&cIdToken=${data.cIdToken}`
  qrCodeUrl += `&cHashQRCode=${cHashQRCode}`

  return qrCodeUrl
}

/**
 * Gera a chave de acesso da NFC-e (44 dígitos)
 *
 * Formato:
 * - 2 dígitos: Código UF
 * - 4 dígitos: Ano/Mês (AAMM)
 * - 14 dígitos: CNPJ do emitente
 * - 2 dígitos: Modelo (65 para NFC-e)
 * - 3 dígitos: Série
 * - 9 dígitos: Número da NF-e
 * - 8 dígitos: Código numérico aleatório (CNF)
 * - 1 dígito: Dígito verificador
 *
 * @param uf Sigla da UF
 * @param dataEmissao Data de emissão
 * @param cnpj CNPJ do emitente
 * @param serie Série da nota
 * @param numero Número da nota
 * @param cnf Código numérico aleatório (8 dígitos)
 * @returns Chave de acesso de 44 dígitos
 */
export function generateAccessKey(
  uf: string,
  dataEmissao: Date,
  cnpj: string,
  serie: number,
  numero: number,
  cnf: string,
  tpEmis: number
): string {
  // Código da UF (2 dígitos)
  const cUF = getUFCode(uf).toString().padStart(2, '0')

  // Ano/Mês (AAMM - 4 dígitos)
  const year = dataEmissao.getFullYear().toString().slice(-2)
  const month = (dataEmissao.getMonth() + 1).toString().padStart(2, '0')
  const aamm = year + month

  // CNPJ (14 dígitos)
  const cnpjDigits = cleanCNPJ(cnpj).padStart(14, '0')

  // Modelo (65 para NFC-e)
  const modelo = '65'

  // Série (3 dígitos)
  const serieFormatted = serie.toString().padStart(3, '0')

  // Número da nota (9 dígitos)
  const numeroFormatted = numero.toString().padStart(9, '0')

  // Tipo de emissão (1 dígito)
  const tpEmisFormatted = tpEmis.toString().padStart(1, '0')

  // Código numérico (8 dígitos)
  const cnfFormatted = cnf.padStart(8, '0')

  // Monta chave sem o dígito verificador (43 dígitos)
  const chaveBase =
    cUF +
    aamm +
    cnpjDigits +
    modelo +
    serieFormatted +
    numeroFormatted +
    tpEmisFormatted +
    cnfFormatted

  if (!/^\d{43}$/.test(chaveBase)) {
    throw new Error('Chave base invalida para calculo do DV (tamanho ou formato incorreto)')
  }

  // Calcula dígito verificador (módulo 11)
  const dv = calculateMod11(chaveBase)

  // Chave completa (44 dígitos)
  return chaveBase + dv
}

/**
 * Calcula dígito verificador usando módulo 11
 * Algoritmo usado para chave de acesso da NF-e
 *
 * @param value String numérica
 * @returns Dígito verificador (0-9)
 */
function calculateMod11(value: string): string {
  let sum = 0
  let weight = 2

  // Percorre de trás para frente
  for (let i = value.length - 1; i >= 0; i--) {
    sum += Number.parseInt(value[i]) * weight
    weight++
    if (weight > 9) weight = 2
  }

  const remainder = sum % 11
  const dv = remainder === 0 || remainder === 1 ? 0 : 11 - remainder

  return dv.toString()
}

/**
 * Valida formato da chave de acesso (44 dígitos)
 * @param chaveAcesso Chave de acesso
 * @returns true se válida
 */
export function isValidAccessKey(chaveAcesso: string): boolean {
  // Remove não-dígitos
  const digits = chaveAcesso.replace(/\D/g, '')

  // Deve ter 44 dígitos
  if (digits.length !== 44) return false

  // Valida dígito verificador
  const chaveBase = digits.slice(0, 43)
  const dvInformado = digits[43]
  const dvCalculado = calculateMod11(chaveBase)

  return dvInformado === dvCalculado
}

/**
 * Extrai informações da chave de acesso
 * @param chaveAcesso Chave de 44 dígitos
 * @returns Dados extraídos
 */
export function parseAccessKey(chaveAcesso: string): {
  uf: string
  aamm: string
  cnpj: string
  modelo: string
  serie: number
  numero: number
  cnf: string
  dv: string
} {
  const digits = chaveAcesso.replace(/\D/g, '')

  if (digits.length !== 44) {
    throw new Error('Chave de acesso deve ter 44 dígitos')
  }

  return {
    uf: digits.slice(0, 2),
    aamm: digits.slice(2, 6),
    cnpj: digits.slice(6, 20),
    modelo: digits.slice(20, 22),
    serie: Number.parseInt(digits.slice(22, 25)),
    numero: Number.parseInt(digits.slice(25, 34)),
    cnf: digits.slice(34, 42),
    dv: digits[43],
  }
}

/**
 * Formata chave de acesso com espaços para leitura
 * @param chaveAcesso Chave sem formatação
 * @returns Chave formatada: 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000
 */
export function formatAccessKey(chaveAcesso: string): string {
  const digits = chaveAcesso.replace(/\D/g, '')
  return digits.match(/.{1,4}/g)?.join(' ') || digits
}
