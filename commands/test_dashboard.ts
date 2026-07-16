import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class TestDashboard extends BaseCommand {
  static commandName = 'test:dashboard'
  static description = 'Testa o acesso ao dashboard'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email do usuário para teste' })
  declare email: string

  async run() {
    try {
      this.logger.info('🔍 Testando acesso ao dashboard...')

      // Verificar se o usuário existe
      const user = await User.findByOrFail('email', this.email)
      this.logger.info(`✅ Usuário encontrado: ${user.fullName} (ID: ${user.id})`)

      // Carregar relacionamentos
      await user.load('empresa')
      await user.load('role')

      this.logger.info(`✅ Empresa: ${user.empresa?.name} (Ativa: ${user.empresa?.active})`)
      this.logger.info(`✅ Role: ${user.role.name}`)

      // Verificar se está ativo
      this.logger.info(`✅ Status do usuário: ${user.status}`)
      this.logger.info(`✅ Usuário ativo: ${user.isActive}`)

      this.logger.success('✅ Usuário pode acessar o dashboard!')

      // Verificar se a view existe
      this.logger.info('🔍 Verificando se as views existem...')
      const { existsSync } = await import('node:fs')
      const { resolve } = await import('node:path')

      const viewPaths = [
        'resources/views/dashboard/index.edge',
        'resources/views/layouts/dashboard.edge',
        'resources/views/layouts/app.edge',
      ]

      for (const viewPath of viewPaths) {
        const fullPath = resolve(viewPath)
        const exists = existsSync(fullPath)
        this.logger.info(`${exists ? '✅' : '❌'} ${viewPath}: ${exists}`)
      }
    } catch (error) {
      this.logger.error('❌ Erro no teste:', error.message)
      this.exitCode = 1
    }
  }
}
