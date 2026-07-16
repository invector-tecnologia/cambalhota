import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    /**
     * processing_rules
     */
    await this.schema.withSchema('tavolo').createTable('processing_rules', (table) => {
      table.increments('id').primary()
      table
        .integer('empresa_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table
        .enum('type', [
          'stock_reservation',
          'stock_deduction',
          'discount_apply',
          'nfe_emit',
          'comanda_closing',
          'pedido_status_sync',
          'custom',
        ])
        .notNullable()
      table.integer('priority').defaultTo(50)
      table.boolean('enabled').defaultTo(true)
      table.string('handler', 255).notNullable()
      table.json('config').nullable()
      table
        .enum('applied_to', ['pedido', 'venda', 'comanda', 'nfe', 'geral'])
        .notNullable()
      table.text('description').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['empresa_id', 'enabled'])
      table.index(['type'])
      table.index(['applied_to'])
    })

    /**
     * processing_events
     */
    await this.schema.withSchema('tavolo').createTable('processing_events', (table) => {
      table.increments('id').primary()
      table
        .integer('empresa_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table
        .integer('processing_rule_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('processing_rules')
        .onDelete('CASCADE')
      table.string('entity_type').notNullable()
      table.integer('entity_id').notNullable()
      table.string('rule_name').notNullable()
      table
        .enum('status', ['pending', 'processing', 'success', 'failed', 'reprocessing'])
        .defaultTo('pending')
      table.text('error_message').nullable()
      table.text('error_stack_trace').nullable()
      table.json('result_data').nullable()
      table
        .integer('executed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('executed_at', { useTz: true }).nullable()
      table.integer('reprocess_attempts').defaultTo(0)
      table.timestamp('last_reprocess_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['empresa_id'])
      table.index(['entity_type', 'entity_id'])
      table.index(['status'])
      table.index(['processing_rule_id'])
      table.index(['created_at'])
      table.index(['status', 'entity_type'])
    })

    /**
     * entity_processing_status
     */
    await this.schema.withSchema('tavolo').createTable('entity_processing_status', (table) => {
      table.increments('id').primary()
      table
        .integer('empresa_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table.string('entity_type').notNullable()
      table.integer('entity_id').notNullable()
      table
        .enum('status', ['pending', 'partial', 'complete', 'failed'])
        .defaultTo('pending')
      table.json('failed_rules').nullable()
      table.json('completed_rules').nullable()
      table.timestamp('last_processed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['entity_type', 'entity_id'])
      table.index(['empresa_id'])
      table.index(['status'])
      table.index(['entity_type'])
    })
  }

  async down() {
    await this.schema.withSchema('tavolo').dropTable('entity_processing_status')
    await this.schema.withSchema('tavolo').dropTable('processing_events')
    await this.schema.withSchema('tavolo').dropTable('processing_rules')
  }
}
