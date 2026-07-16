/**
 * Helper para trabalhar com códigos IBGE de municípios e UFs
 */

import db from '@adonisjs/lucid/services/db'

/**
 * Mapeamento de UF para código IBGE
 */
const UF_CODES: Record<string, number> = {
  RO: 11, // Rondônia
  AC: 12, // Acre
  AM: 13, // Amazonas
  RR: 14, // Roraima
  PA: 15, // Pará
  AP: 16, // Amapá
  TO: 17, // Tocantins
  MA: 21, // Maranhão
  PI: 22, // Piauí
  CE: 23, // Ceará
  RN: 24, // Rio Grande do Norte
  PB: 25, // Paraíba
  PE: 26, // Pernambuco
  AL: 27, // Alagoas
  SE: 28, // Sergipe
  BA: 29, // Bahia
  MG: 31, // Minas Gerais
  ES: 32, // Espírito Santo
  RJ: 33, // Rio de Janeiro
  SP: 35, // São Paulo
  PR: 41, // Paraná
  SC: 42, // Santa Catarina
  RS: 43, // Rio Grande do Sul
  MS: 50, // Mato Grosso do Sul
  MT: 51, // Mato Grosso
  GO: 52, // Goiás
  DF: 53, // Distrito Federal
}

/**
 * Mapeamento reverso: código → UF
 */
const CODE_TO_UF: Record<number, string> = Object.fromEntries(
  Object.entries(UF_CODES).map(([uf, code]) => [code, uf])
)

export class IBGEHelper {
  /**
   * Obtém código IBGE da UF (2 dígitos)
   * @param uf - Sigla do estado (ex: 'SP', 'MG')
   * @returns Código IBGE da UF ou undefined se inválido
   */
  static getUFCode(uf: string): number | undefined {
    return UF_CODES[uf.toUpperCase()]
  }

  /**
   * Obtém UF a partir do código IBGE
   * @param code - Código IBGE (ex: 35, 31)
   * @returns Sigla da UF ou undefined se inválido
   */
  static getUFFromCode(code: number): string | undefined {
    return CODE_TO_UF[code]
  }

  /**
   * Valida se a UF é válida
   * @param uf - Sigla do estado
   * @returns true se válido
   */
  static isValidUF(uf: string): boolean {
    return uf.toUpperCase() in UF_CODES
  }

  /**
   * Busca código IBGE do município pelo nome e UF
   * @param cityName - Nome do município (ex: 'São Paulo', 'Belo Horizonte')
   * @param uf - Sigla do estado (ex: 'SP', 'MG')
   * @returns Código IBGE do município (7 dígitos) ou null se não encontrado
   */
  static async getCityCode(cityName: string, uf: string): Promise<string | null> {
    try {
      // Normaliza o nome do município (remove acentos e converte para maiúsculas)
      const normalizedCityName = this.normalizeCityName(cityName)

      const result = await db
        .from('municipios_ibge')
        .select('codigo')
        .whereRaw('UPPER(UNACCENT(nome)) = UPPER(UNACCENT(?))', [normalizedCityName])
        .where('uf', uf.toUpperCase())
        .first()

      return result?.codigo || null
    } catch (error) {
      console.error('Erro ao buscar código IBGE do município:', error)
      return null
    }
  }

  /**
   * Busca código IBGE do município pelo código exato (mais rápido)
   * @param codigo - Código IBGE do município (7 dígitos)
   * @returns Dados do município ou null se não encontrado
   */
  static async getCityByCode(codigo: string): Promise<{
    codigo: string
    nome: string
    uf: string
    codigo_uf: number
  } | null> {
    try {
      const result = await db
        .from('municipios_ibge')
        .select('codigo', 'nome', 'uf', 'codigo_uf')
        .where('codigo', codigo)
        .first()

      return result || null
    } catch (error) {
      console.error('Erro ao buscar município por código:', error)
      return null
    }
  }

  /**
   * Busca municípios por nome (busca parcial)
   * @param cityName - Nome parcial do município
   * @param uf - Sigla do estado (opcional)
   * @param limit - Limite de resultados (padrão: 10)
   * @returns Array de municípios encontrados
   */
  static async searchCities(
    cityName: string,
    uf?: string,
    limit: number = 10
  ): Promise<
    Array<{
      codigo: string
      nome: string
      uf: string
      codigo_uf: number
    }>
  > {
    try {
      const query = db
        .from('municipios_ibge')
        .select('codigo', 'nome', 'uf', 'codigo_uf')
        .whereRaw('UPPER(UNACCENT(nome)) LIKE UPPER(UNACCENT(?))', [`%${cityName}%`])
        .orderBy('nome')
        .limit(limit)

      if (uf) {
        query.where('uf', uf.toUpperCase())
      }

      return await query
    } catch (error) {
      console.error('Erro ao buscar municípios:', error)
      return []
    }
  }

  /**
   * Lista todos os municípios de uma UF
   * @param uf - Sigla do estado
   * @returns Array de municípios
   */
  static async getCitiesByUF(uf: string): Promise<
    Array<{
      codigo: string
      nome: string
      uf: string
      codigo_uf: number
    }>
  > {
    try {
      return await db
        .from('municipios_ibge')
        .select('codigo', 'nome', 'uf', 'codigo_uf')
        .where('uf', uf.toUpperCase())
        .orderBy('nome')
    } catch (error) {
      console.error('Erro ao listar municípios da UF:', error)
      return []
    }
  }

  /**
   * Normaliza nome do município para comparação
   * Remove acentos, converte para maiúsculas e padroniza
   * @param name - Nome do município
   * @returns Nome normalizado
   */
  private static normalizeCityName(name: string): string {
    return name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim()
  }

  /**
   * Valida código IBGE de município (7 dígitos)
   * @param codigo - Código IBGE
   * @returns true se válido
   */
  static isValidCityCode(codigo: string): boolean {
    return /^\d{7}$/.test(codigo)
  }

  /**
   * Extrai código da UF de um código de município
   * Os 2 primeiros dígitos do código do município correspondem ao código da UF
   * @param cityCode - Código IBGE do município (7 dígitos)
   * @returns Código da UF (2 dígitos) ou undefined se inválido
   */
  static getUFCodeFromCityCode(cityCode: string): number | undefined {
    if (!this.isValidCityCode(cityCode)) return undefined
    return Number.parseInt(cityCode.substring(0, 2))
  }

  /**
   * Obtém todas as UFs cadastradas
   * @returns Array com todas as siglas de UF
   */
  static getAllUFs(): string[] {
    return Object.keys(UF_CODES).sort()
  }

  /**
   * Obtém informações completas de uma UF
   * @param uf - Sigla do estado
   * @returns Objeto com código e sigla ou undefined
   */
  static getUFInfo(uf: string): { code: number; uf: string } | undefined {
    const code = this.getUFCode(uf)
    if (!code) return undefined
    return { code, uf: uf.toUpperCase() }
  }
}
