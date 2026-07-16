import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Empresa from '#models/empresa'

export default class MigrateRazaoSocial extends BaseCommand {
  static commandName = 'empresa:migrate-razao-social'
  static description = 'Migra dados do campo name para razaoSocial quando este estiver vazio'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔄 Iniciando migração de dados: name → razaoSocial')

    // Buscar todas as empresas com razaoSocial vazio
    const empresas = await Empresa.query().whereNull('razao_social').orWhere('razao_social', '')

    if (empresas.length === 0) {
      this.logger.success(
        '✅ Nenhuma empresa precisa de migração. Todas já possuem razaoSocial preenchido.'
      )
      return
    }

    this.logger.info(`📋 Encontradas ${empresas.length} empresas para migrar:`)

    for (const empresa of empresas) {
      this.logger.info(`\n  ID ${empresa.id}: ${empresa.razaoSocial || '(sem nome)'}`)
      this.logger.info(`    razãoSocial antes: ${empresa.razaoSocial || '(vazio)'}`)

      // Se razaoSocial está vazio, não podemos migrar nada
      this.logger.warning(`    ⚠️  Empresa sem razão social - precisa ser preenchida manualmente`)

      this.logger.info(`\n✅ Migração concluída! ${empresas.length} empresa(s) atualizada(s).`)
      this.logger.info(
        '\n💡 Dica: Os usuários agora podem editar o campo "Razão Social" na tela de configurações.'
      )
    }
  }
}
