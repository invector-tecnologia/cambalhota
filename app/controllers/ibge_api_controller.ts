import { HttpContext } from '@adonisjs/core/http'
import { IBGEHelper } from '#helpers/ibge_helper'

/**
 * Controller para API de consulta IBGE
 * Fornece endpoints para buscar código de municípios
 */
export default class IbgeApiController {
  /**
   * GET /api/ibge/municipio
   * Busca código IBGE de um município por nome e UF
   */
  async getMunicipio({ request, response }: HttpContext) {
    try {
      const city = request.input('city')
      const state = request.input('state')

      if (!city || !state) {
        return response.status(400).json({
          success: false,
          error: 'Parâmetros city e state são obrigatórios',
        })
      }

      // Validar UF
      if (state.length !== 2) {
        return response.status(400).json({
          success: false,
          error: 'UF deve ter exatamente 2 caracteres',
        })
      }

      const codigo = await IBGEHelper.getCityCode(city, state.toUpperCase())

      if (!codigo) {
        // Buscar sugestões
        const suggestions = await IBGEHelper.searchCities(city, state.toUpperCase(), 5)

        return response.json({
          success: false,
          error: 'Município não encontrado',
          suggestions: suggestions.map((c) => ({
            nome: c.nome,
            uf: c.uf,
            codigo: c.codigo,
          })),
        })
      }

      // Buscar nome completo para confirmar
      const municipio = await IBGEHelper.searchCities(city, state.toUpperCase(), 1)

      return response.json({
        success: true,
        codigo: codigo,
        nome: municipio[0]?.nome || city,
        uf: municipio[0]?.uf || state.toUpperCase(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(500).json({
        success: false,
        error: 'Erro ao buscar município',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /api/ibge/municipios
   * Lista municípios com filtro opcional
   */
  async listMunicipios({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const state = request.input('state')
      const limit = request.input('limit', 50)

      const municipios = await IBGEHelper.searchCities(query, state, limit)

      return response.json({
        success: true,
        data: municipios.map((c) => ({
          nome: c.nome,
          uf: c.uf,
          codigo: c.codigo,
        })),
        total: municipios.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(500).json({
        success: false,
        error: 'Erro ao listar municípios',
        message: errorMessage,
      })
    }
  }
}
