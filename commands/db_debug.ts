import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import Empresa from '#models/empresa'
import Role from '#models/role'

export default class DbDebug extends BaseCommand {
  static commandName = 'db:debug'
  static description = 'Debug database records for troubleshooting'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('🔍 Debug do Banco de Dados')

    try {
      // Contar registros
      const userCount = await User.query().count('* as total').first()
      const companyCount = await Empresa.query().count('* as total').first()
      const roleCount = await Role.query().count('* as total').first()

      this.logger.info('📊 Contadores:')
      this.logger.info(`  - Usuários: ${userCount?.$extras?.total || 0}`)
      this.logger.info(`  - Empresas: ${companyCount?.$extras?.total || 0}`)
      this.logger.info(`  - Roles: ${roleCount?.$extras?.total || 0}`)

      // Listar roles
      this.logger.info('\n🔐 Roles disponíveis:')
      const roles = await Role.query().select('id', 'name', 'description')
      roles.forEach((role) => {
        this.logger.info(`  - ID ${role.id}: ${role.name} (${role.description})`)
      })

      // Listar empresas
      this.logger.info('\n🏢 Empresas cadastradas:')
      const companies = await Empresa.query().select('id', 'name', 'cnpj', 'active')
      if (companies.length === 0) {
        this.logger.info('  Nenhuma empresa encontrada')
      } else {
        companies.forEach((company) => {
          this.logger.info(
            `  - ID ${company.id}: ${company.name} (${company.cnpj}) - ${
              company.active ? 'Ativa' : 'Inativa'
            }`
          )
        })
      }
    } catch (error) {
      this.logger.error('❌ Erro ao debugar banco:', error.message)
    }
  }
}
