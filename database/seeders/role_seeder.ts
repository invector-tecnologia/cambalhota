import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    // Criar roles padrão do sistema
    const roles = [
      {
        name: 'admin',
        description: 'Administrador do sistema com acesso completo',
        permissions: {
          almoxarifado: ['create', 'read', 'update', 'delete'],
          cardapio: ['create', 'read', 'update', 'delete'],
          pedidos: ['create', 'read', 'update', 'delete'],
          comandas: ['create', 'read', 'update', 'delete'],
          financeiro: ['create', 'read', 'update', 'delete'],
          usuarios: ['create', 'read', 'update', 'delete'],
        },
      },
      {
        name: 'gerente',
        description: 'Gerente com acesso a operações e relatórios',
        permissions: {
          almoxarifado: ['read', 'update'],
          cardapio: ['create', 'read', 'update', 'delete'],
          pedidos: ['create', 'read', 'update', 'delete'],
          comandas: ['create', 'read', 'update', 'delete'],
          financeiro: ['read'],
          usuarios: ['read'],
        },
      },
      {
        name: 'operador',
        description: 'Operador de comandas e pedidos',
        permissions: {
          almoxarifado: ['read'],
          cardapio: ['read'],
          pedidos: ['create', 'read', 'update'],
          comandas: ['create', 'read', 'update'],
          financeiro: [],
          usuarios: [],
        },
      },
    ]

    // Usar updateOrCreate para evitar duplicatas
    for (const roleData of roles) {
      await Role.updateOrCreate({ name: roleData.name }, roleData)
    }
  }
}
