import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class MunicipioIbge extends BaseModel {
  static table = 'tavolo.municipios_ibge'

  @column({ isPrimary: true })
  declare codigo: string

  @column()
  declare nome: string

  @column()
  declare uf: string

  @column()
  declare codigoUf: number

  /**
   * Busca o código IBGE de um município pelo nome e UF
   */
  static async getCityCode(cityName: string, uf: string): Promise<string | null> {
    const normalizedCity = cityName.toUpperCase().trim()
    const normalizedUf = uf.toUpperCase().trim()

    const municipio = await this.query()
      .where('nome', normalizedCity)
      .where('uf', normalizedUf)
      .first()

    return municipio?.codigo || null
  }

  /**
   * Busca municípios por UF (para autocomplete)
   */
  static async getCitiesByUF(uf: string): Promise<MunicipioIbge[]> {
    return await this.query().where('uf', uf.toUpperCase()).orderBy('nome', 'asc')
  }

  /**
   * Busca municípios por nome parcial (para search)
   */
  static async searchCities(query: string, uf?: string): Promise<MunicipioIbge[]> {
    const search = this.query()
      .whereLike('nome', `%${query.toUpperCase()}%`)
      .limit(50)
      .orderBy('nome', 'asc')

    if (uf) {
      search.where('uf', uf.toUpperCase())
    }

    return await search
  }
}
