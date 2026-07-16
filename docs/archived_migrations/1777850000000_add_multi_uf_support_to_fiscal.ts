import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration para suporte multi-UF no sistema fiscal
 * Adiciona campos necessários para identificar e controlar emissão em todas as 27 UFs brasileiras
 */
export default class extends BaseSchema {
  protected tableName = 'fiscal_configs'

  async up() {
    // 1. Adicionar campos em fiscal_configs
    await this.schema.alterTable('fiscal_configs', (table) => {
      table
        .string('state_override', 2)
        .nullable()
        .comment('Override manual de UF (se diferente do estabelecimento)')

      table
        .string('autorizador', 20)
        .nullable()
        .comment('Autorizador calculado: SVRS, SVAN, SEFAZ_PROPRIA, etc')

      table.integer('serie').defaultTo(1).notNullable().comment('Série da numeração NFC-e (1-999)')

      // Índice para consultas por estado
      table.index(['state_override'], 'idx_fiscal_configs_state')
    })

    // 2. Adicionar campos em fiscal_notes
    await this.schema.alterTable('fiscal_notes', (table) => {
      table.string('uf', 2).nullable().comment('UF onde a nota foi emitida')

      table.integer('numero').nullable().comment('Número sequencial da nota')

      table.integer('serie').defaultTo(1).notNullable().comment('Série da nota emitida')

      // Índices para consultas e relatórios
      table.index(['uf', 'created_at'], 'idx_fiscal_notes_uf_created')
      table.index(['uf', 'status'], 'idx_fiscal_notes_uf_status')
      table.index(['serie', 'numero'], 'idx_fiscal_notes_serie_numero')
    })

    // 3. Garantir que empresas têm campo state (se não existir)
    // Esta parte pode ser omitida se o campo já existe
    const hasState = await this.schema.hasColumn('empresas', 'state')
    if (!hasState) {
      await this.schema.alterTable('empresas', (table) => {
          table
            .string('state', 2)
            .notNullable()
            .defaultTo('SP')
            .comment('UF do estabelecimento (sigla)')
        })
      }
  }

  async down() {
    // Reverter alterações em fiscal_configs
    await this.schema.alterTable('fiscal_configs', (table) => {
      table.dropIndex(['state_override'], 'idx_fiscal_configs_state')
      table.dropColumn('state_override')
      table.dropColumn('autorizador')
      table.dropColumn('serie')
    })

    // Reverter alterações em fiscal_notes
    await this.schema.alterTable('fiscal_notes', (table) => {
      table.dropIndex(['uf', 'created_at'], 'idx_fiscal_notes_uf_created')
      table.dropIndex(['uf', 'status'], 'idx_fiscal_notes_uf_status')
      table.dropIndex(['serie', 'numero'], 'idx_fiscal_notes_serie_numero')
      table.dropColumn('uf')
      table.dropColumn('numero')
      table.dropColumn('serie')
    })
  }
}
