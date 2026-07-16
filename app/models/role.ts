import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export interface Permission {
  almoxarifado: string[]
  cardapio: string[]
  pedidos: string[]
  comandas: string[]
  financeiro: string[]
  usuarios: string[]
}

export default class Role extends BaseModel {
  static table = 'tavolo.roles'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({
    serialize: (value: string) => {
      try {
        return JSON.parse(value)
      } catch {
        return {}
      }
    },
    prepare: (value: Permission | string) => {
      return typeof value === 'string' ? value : JSON.stringify(value)
    },
  })
  declare permissions: Permission

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  // Métodos para verificar permissões
  can(module: keyof Permission, action: string): boolean {
    if (!this.permissions || !this.permissions[module]) return false
    return this.permissions[module].includes(action)
  }

  canCreate(module: keyof Permission): boolean {
    return this.can(module, 'create')
  }

  canRead(module: keyof Permission): boolean {
    return this.can(module, 'read')
  }

  canUpdate(module: keyof Permission): boolean {
    return this.can(module, 'update')
  }

  canDelete(module: keyof Permission): boolean {
    return this.can(module, 'delete')
  }

  // Verificar se é admin
  get isAdmin(): boolean {
    return this.name === 'admin'
  }

  // Verificar se é gerente
  get isManager(): boolean {
    return this.name === 'gerente'
  }

  // Verificar se é funcionário
  get isEmployee(): boolean {
    return this.name === 'funcionario'
  }
}
