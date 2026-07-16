import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Atualizar permissões dos roles para incluir mesas
    const roles = await this.db.from('roles').select('*')

    for (const role of roles) {
      let permissions

      try {
        permissions =
          typeof role.permissions === 'string'
            ? JSON.parse(role.permissions)
            : role.permissions || {}
      } catch (error) {
        console.error(`Erro ao parsear permissões do role ${role.name}:`, error)
        permissions = {}
      }

      // Adicionar permissões de mesas baseado no tipo de role
      if (role.name === 'Super Admin' || role.name === 'Administrador') {
        permissions.mesas = ['create', 'read', 'update', 'delete']
      } else if (role.name === 'Gerente') {
        permissions.mesas = ['create', 'read', 'update']
      } else if (role.name === 'Garçom' || role.name === 'Atendente') {
        permissions.mesas = ['read']
      }

      await this.db
        .from('roles')
        .where('id', role.id)
        .update({
          permissions: typeof permissions === 'object' ? JSON.stringify(permissions) : permissions,
        })
    }
  }

  async down() {
    // Remover permissões de mesas
    const roles = await this.db.from('roles').select('*')

    for (const role of roles) {
      let permissions

      try {
        permissions =
          typeof role.permissions === 'string'
            ? JSON.parse(role.permissions)
            : role.permissions || {}
      } catch (error) {
        console.error(`Erro ao parsear permissões do role ${role.name}:`, error)
        permissions = {}
      }

      delete permissions.mesas

      await this.db
        .from('roles')
        .where('id', role.id)
        .update({
          permissions: typeof permissions === 'object' ? JSON.stringify(permissions) : permissions,
        })
    }
  }
}
