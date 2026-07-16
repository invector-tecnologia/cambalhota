import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    /**
     * assinaturas_empresas
     */
    const hasAssinaturasEmpresas = await this.schema.withSchema('tavolo').hasTable('assinaturas_empresas')
    if (!hasAssinaturasEmpresas) {
      await this.schema.withSchema('tavolo').createTable('assinaturas_empresas', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .unique()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table.string('plano').notNullable()
        table
          .enum('status', ['trial', 'active', 'past_due', 'canceled'])
          .defaultTo('trial')
        table.decimal('valor_mensal', 10, 2).defaultTo(0)
        table.string('moeda', 3).defaultTo('BRL')
        table.timestamp('proximo_vencimento', { useTz: true }).nullable()
        table.timestamp('ultimo_pagamento_em', { useTz: true }).nullable()
        table.integer('dias_tolerancia').defaultTo(5)
        table.string('gateway_ref').nullable()
        table.text('observacoes').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['status'])
        table.index(['proximo_vencimento'])
      })
    }

    /**
     * suporte_solicitacoes
     */
    const hasSuporteSolicitacoes = await this.schema.withSchema('tavolo').hasTable('suporte_solicitacoes')
    if (!hasSuporteSolicitacoes) {
      await this.schema.withSchema('tavolo').createTable('suporte_solicitacoes', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('empresas')
          .onDelete('SET NULL')
        table.string('protocolo').unique().notNullable()
        table
          .integer('opened_by_user_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
        table.string('nome_contato').notNullable()
        table.string('email_contato').notNullable()
        table.string('assunto').notNullable()
        table.text('mensagem').notNullable()
        table.string('categoria').notNullable()
        table
          .enum('prioridade', ['baixa', 'media', 'alta', 'urgente'])
          .defaultTo('media')
        table
          .enum('status', [
            'novo',
            'aberto',
            'em_andamento',
            'aguardando_usuario',
            'solucao_sugerida',
            'resolvido',
            'fechado',
            'cancelado',
          ])
          .defaultTo('novo')
        table.string('canal').notNullable()
        table.string('responsavel').nullable()
        table.timestamp('resolvido_em', { useTz: true }).nullable()
        table.timestamp('cancelado_em', { useTz: true }).nullable()
        table.timestamp('solucao_sugerida_em', { useTz: true }).nullable()
        table.timestamp('ultima_interacao_usuario_em', { useTz: true }).nullable()
        table.timestamp('ultima_interacao_admin_em', { useTz: true }).nullable()
        table.integer('admin_no_reply_streak').defaultTo(0)
        table.string('resolvido_por').nullable()
        table.text('resolucao_motivo').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['empresa_id'])
        table.index(['status'])
        table.index(['prioridade'])
        table.index(['created_at'])
        table.index(['opened_by_user_id'])
        table.index(['status', 'updated_at'])
      })
    }

    /**
     * suporte_mensagens
     */
    const hasSuporteMensagens = await this.schema.withSchema('tavolo').hasTable('suporte_mensagens')
    if (!hasSuporteMensagens) {
      await this.schema.withSchema('tavolo').createTable('suporte_mensagens', (table) => {
        table.increments('id').primary()
        table
          .integer('ticket_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('suporte_solicitacoes')
          .onDelete('CASCADE')
        table
          .integer('sender_user_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
        table.enum('sender_tipo', ['usuario', 'admin', 'sistema']).notNullable()
        table.text('mensagem').notNullable()
        table.timestamp('lida_usuario_em', { useTz: true }).nullable()
        table.timestamp('lida_admin_em', { useTz: true }).nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['ticket_id', 'created_at'])
        table.index(['sender_tipo'])
        table.index(['lida_usuario_em'])
        table.index(['lida_admin_em'])
      })
    }

    /**
     * voice_configs
     */
    const hasVoiceConfigs = await this.schema.withSchema('tavolo').hasTable('voice_configs')
    if (!hasVoiceConfigs) {
      await this.schema.withSchema('tavolo').createTable('voice_configs', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .unique()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table.string('openai_api_key_encrypted').nullable()
        table.boolean('enabled').defaultTo(false)
        table.string('whisper_model').nullable()
        table.string('llm_model').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['empresa_id', 'enabled'])
      })
    }

    /**
     * user_quick_actions
     */
    const hasUserQuickActions = await this.schema.withSchema('tavolo').hasTable('user_quick_actions')
    if (!hasUserQuickActions) {
      await this.schema.withSchema('tavolo').createTable('user_quick_actions', (table) => {
        table.increments('id').primary()
        table
          .integer('user_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE')
        table.string('action_key', 100).notNullable()
        table.boolean('enabled').defaultTo(true)
        table.integer('sort_order').defaultTo(0)
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.unique(['user_id', 'action_key'])
      })
    }

    /**
     * insumo_reservas
     */
    const hasInsumoReservas = await this.schema.withSchema('tavolo').hasTable('insumo_reservas')
    if (!hasInsumoReservas) {
      await this.schema.withSchema('tavolo').createTable('insumo_reservas', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table
          .integer('insumo_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('insumos')
          .onDelete('CASCADE')
        table
          .integer('pedido_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('pedidos')
          .onDelete('CASCADE')
        table
          .integer('pedido_item_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('pedido_itens')
          .onDelete('CASCADE')
        table.decimal('quantidade', 12, 3).notNullable()
        table.string('unidade').notNullable()
        table
          .enum('status', ['reserved', 'deducted', 'released'])
          .defaultTo('reserved')
        table.timestamp('reserved_at', { useTz: true }).notNullable()
        table.timestamp('deducted_at', { useTz: true }).nullable()
        table.timestamp('released_at', { useTz: true }).nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }
  }

  async down() {
    await this.schema.withSchema('tavolo').dropTableIfExists('insumo_reservas')
    await this.schema.withSchema('tavolo').dropTableIfExists('user_quick_actions')
    await this.schema.withSchema('tavolo').dropTableIfExists('voice_configs')
    await this.schema.withSchema('tavolo').dropTableIfExists('suporte_mensagens')
    await this.schema.withSchema('tavolo').dropTableIfExists('suporte_solicitacoes')
    await this.schema.withSchema('tavolo').dropTableIfExists('assinaturas_empresas')
  }
}
