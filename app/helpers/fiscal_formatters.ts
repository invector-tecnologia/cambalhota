/**
 * Helpers para conversões fiscais (UF, IBGE, etc.)
 */

/**
 * Mapeamento de UF para código IBGE
 * Usado em <ide><cUF> do XML da NFC-e
 */
export const UF_CODE_MAP: Record<string, number> = {
  AC: 12, // Acre
  AL: 27, // Alagoas
  AP: 16, // Amapá
  AM: 13, // Amazonas
  BA: 29, // Bahia
  CE: 23, // Ceará
  DF: 53, // Distrito Federal
  ES: 32, // Espírito Santo
  GO: 52, // Goiás
  MA: 21, // Maranhão
  MT: 51, // Mato Grosso
  MS: 50, // Mato Grosso do Sul
  MG: 31, // Minas Gerais
  PA: 15, // Pará
  PB: 25, // Paraíba
  PR: 41, // Paraná
  PE: 26, // Pernambuco
  PI: 22, // Piauí
  RJ: 33, // Rio de Janeiro
  RN: 24, // Rio Grande do Norte
  RS: 43, // Rio Grande do Sul
  RO: 11, // Rondônia
  RR: 14, // Roraima
  SC: 42, // Santa Catarina
  SP: 35, // São Paulo
  SE: 28, // Sergipe
  TO: 17, // Tocantins
}

/**
 * Retorna o código IBGE da UF (2 dígitos)
 * @param uf Sigla da UF (ex: 'MG', 'SP')
 * @returns Código numérico da UF
 * @throws Error se UF inválida
 */
export function getUFCode(uf: string): number {
  const code = UF_CODE_MAP[uf.toUpperCase()]
  if (!code) {
    throw new Error(`UF inválida: ${uf}`)
  }
  return code
}

/**
 * Retorna a sigla da UF pelo código IBGE
 * @param code Código IBGE da UF
 * @returns Sigla da UF
 * @throws Error se código inválido
 */
export function getUFFromCode(code: number): string {
  const entry = Object.entries(UF_CODE_MAP).find(([_, c]) => c === code)
  if (!entry) {
    throw new Error(`Código de UF inválido: ${code}`)
  }
  return entry[0]
}

/**
 * Valida se uma UF é válida
 * @param uf Sigla da UF
 * @returns true se válida
 */
export function isValidUF(uf: string): boolean {
  return uf.toUpperCase() in UF_CODE_MAP
}

/**
 * Lista todas as UFs disponíveis
 * @returns Array com todas as UFs
 */
export function getAllUFs(): string[] {
  return Object.keys(UF_CODE_MAP)
}

/**
 * Formata CNPJ (adiciona máscara)
 * @param cnpj CNPJ sem formatação (apenas dígitos)
 * @returns CNPJ formatado: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos')
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Remove formatação do CNPJ
 * @param cnpj CNPJ formatado
 * @returns Apenas dígitos
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/**
 * Formata CPF (adiciona máscara)
 * @param cpf CPF sem formatação (apenas dígitos)
 * @returns CPF formatado: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos')
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Remove formatação do CPF
 * @param cpf CPF formatado
 * @returns Apenas dígitos
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Formata CEP (adiciona máscara)
 * @param cep CEP sem formatação (apenas dígitos)
 * @returns CEP formatado: 00000-000
 */
export function formatCEP(cep: string): string {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos')
  }
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Remove formatação do CEP
 * @param cep CEP formatado
 * @returns Apenas dígitos
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Formata Inscrição Estadual (MG)
 * Cada UF tem seu próprio formato, este é apenas exemplo para MG
 * @param ie IE sem formatação
 * @returns IE formatada
 */
export function formatIE(ie: string, uf: string): string {
  const digits = ie.replace(/\D/g, '')

  // Exemplo apenas para MG: 000.000.000.0000
  if (uf.toUpperCase() === 'MG' && digits.length === 13) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3.$4')
  }

  // Para outras UFs, retorna sem formatação (implementar conforme necessário)
  return digits
}

/**
 * Valida formato básico de CNPJ (apenas formato, não valida dígitos verificadores)
 * @param cnpj CNPJ para validar
 * @returns true se formato válido
 */
export function isValidCNPJFormat(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  return digits.length === 14
}

/**
 * Valida formato básico de CPF (apenas formato, não valida dígitos verificadores)
 * @param cpf CPF para validar
 * @returns true se formato válido
 */
export function isValidCPFFormat(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  return digits.length === 11
}

/**
 * Valida formato básico de CEP
 * @param cep CEP para validar
 * @returns true se formato válido
 */
export function isValidCEPFormat(cep: string): boolean {
  const digits = cep.replace(/\D/g, '')
  return digits.length === 8
}

/**
 * Converte valor monetário para formato XML (2 casas decimais sem separador de milhar)
 * @param value Valor numérico
 * @returns String formatada para XML (ex: "100.50")
 */
export function formatMoneyForXML(value: number | string): string {
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value
  if (Number.isNaN(numValue)) {
    throw new Error(`Valor inválido para formatMoneyForXML: ${value}`)
  }
  return numValue.toFixed(2)
}

/**
 * Formata data/hora para o padrão SEFAZ
 * Formato: AAAA-MM-DDTHH:MM:SS±HH:MM
 * @param date Data a formatar
 * @returns String formatada
 */
export function formatDateTimeForSEFAZ(date: Date = new Date(), uf?: string): string {
  // Formato ISO com timezone da UF emitente
  // Ex: 2026-01-25T14:30:00-03:00
  const timezone = uf ? getUFTimezoneOffset(uf) : getLocalTimezoneOffset(date)

  // Calcula o offset em milissegundos para ajustar UTC → horário local
  const match = timezone.match(/^([+-])(\d{2}):(\d{2})$/)
  if (!match) {
    // Fallback seguro: retorna UTC
    return date.toISOString().replace(/\.\d{3}Z$/, '+00:00')
  }
  const sign = match[1] === '+' ? 1 : -1
  const offsetMs = sign * (Number.parseInt(match[2]) * 60 + Number.parseInt(match[3])) * 60_000

  // Ajusta a data UTC para o horário local da UF
  const localDate = new Date(date.getTime() + offsetMs)
  const isoString = localDate.toISOString()

  // Remove milissegundos e Z, adiciona timezone
  return isoString.replace(/\.\d{3}Z$/, timezone)
}

/**
 * Mapeamento UF → offset UTC conforme fusos horários do Brasil
 * Sem horário de verão (suspenso desde 2019)
 */
function getUFTimezoneOffset(uf: string): string {
  const offsets: Record<string, string> = {
    AC: '-05:00', // Acre Time
    AM: '-04:00', // Amazon Time
    MT: '-04:00',
    MS: '-04:00',
    RO: '-04:00',
    RR: '-04:00',
  }
  return offsets[uf.toUpperCase()] || '-03:00' // Default: Brasília Time (BRT)
}

function getLocalTimezoneOffset(date: Date): string {
  const offset = -date.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const offsetSign = offset >= 0 ? '+' : '-'
  return `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
}
