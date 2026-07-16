import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // Criar role superadmin se não existir
      const superadminRole = await db.from('roles').where('name', 'superadmin').first()

      let roleId: number

      if (!superadminRole) {
        const [newRole] = await db
          .table('roles')
          .insert({
            name: 'superadmin',
            description: 'Super Administrador com acesso total ao sistema',
            permissions: JSON.stringify({
              almoxarifado: ['view', 'create', 'edit', 'delete'],
              cardapio: ['view', 'create', 'edit', 'delete'],
              pedidos: ['view', 'create', 'edit', 'delete'],
              comandas: ['view', 'create', 'edit', 'delete'],
              financeiro: ['view', 'create', 'edit', 'delete'],
              usuarios: ['view', 'create', 'edit', 'delete'],
            }),
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('id')

        roleId = newRole.id
      } else {
        roleId = superadminRole.id
      }

      // Verifica se a coluna role_id existe (para não quebrar a transação no Postgres)
      const hasRoleId = await db.rawQuery(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id'`
      )

      if (hasRoleId.rows.length > 0) {
        // Atualizar usuário bernardo para superadmin
        await db.from('users').where('email', 'bernardo@invector.com.br').update({ role_id: roleId })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      // Pegar ID do role admin
      const adminRole = await db.from('roles').where('name', 'admin').first()

      if (adminRole) {
        const hasRoleId = await db.rawQuery(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id'`
        )

        if (hasRoleId.rows.length > 0) {
          await db
            .from('users')
            .where('email', 'bernardo@invector.com.br')
            .update({ role_id: adminRole.id })
        }
      }
    })
  }
}
