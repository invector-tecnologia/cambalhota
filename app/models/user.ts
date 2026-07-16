import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Role from './role.js'
import type { Permission } from './role.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static table = 'tavolo.users'

  @column({ isPrimary: true })
  declare id: number

  // Dados básicos
  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare cpf: string | null

  @column()
  declare phone: string | null

  @column.date()
  declare birthDate: DateTime | null

  @column()
  declare status: 'active' | 'inactive' | 'suspended'

  // Tema preferido do usuário
  @column()
  declare theme: string

  // Verificação de email
  @column()
  declare emailVerified: boolean

  @column()
  declare verificationToken: string | null

  @column.dateTime()
  declare verificationTokenExpiresAt: DateTime | null

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  // Chaves estrangeiras
  @column()
  declare empresaId: number

  @column()
  declare roleId: number

  @column()
  declare createdBy: number | null

  @column()
  declare updatedBy: number | null

  // Timestamps
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedBy' })
  declare updater: BelongsTo<typeof User>

  /**
   * Verifica se o usuário está ativo
   */
  get isActive(): boolean {
    return this.status === 'active'
  }

  /**
   * Verifica se o usuário está inativo
   */
  get isInactive(): boolean {
    return this.status === 'inactive'
  }

  /**
   * Verifica se o usuário está suspenso
   */
  get isSuspended(): boolean {
    return this.status === 'suspended'
  }

  /**
   * Retorna o CPF formatado (XXX.XXX.XXX-XX)
   */
  get formattedCpf(): string {
    if (!this.cpf) return ''

    // Remove qualquer formatação existente
    const cleaned = this.cpf.replace(/\D/g, '')

    // Valida se tem 11 dígitos
    if (cleaned.length !== 11) return this.cpf

    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }

  /**
   * Retorna o telefone formatado
   */
  get formattedPhone(): string {
    if (!this.phone) return ''
    const cleaned = this.phone.replace(/\D/g, '')

    // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
    }

    return this.phone
  }

  /**
   * Retorna as iniciais do nome do usuário
   */
  get initials(): string {
    if (!this.fullName) return '??'

    const names = this.fullName
      .trim()
      .split(' ')
      .filter((n) => n.length > 0)

    if (names.length === 0) return '??'
    if (names.length === 1) {
      const name = names[0]
      if (name.length === 1) return name.toUpperCase() + '?'
      return name.substring(0, 2).toUpperCase()
    }

    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  /**
   * Retorna o primeiro nome do usuário
   */
  get firstName(): string {
    if (!this.fullName) return ''
    const names = this.fullName
      .trim()
      .split(' ')
      .filter((n) => n.length > 0)
    return names.length > 0 ? names[0] : ''
  }

  /**
   * Retorna o último nome do usuário
   */
  get lastName(): string {
    if (!this.fullName) return ''
    const names = this.fullName
      .trim()
      .split(' ')
      .filter((n) => n.length > 0)
    return names.length > 1 ? names[names.length - 1] : ''
  }

  /**
   * Valida se o CPF é válido (apenas verificação de formato)
   */
  get isValidCpfFormat(): boolean {
    if (!this.cpf) return false
    const cleaned = this.cpf.replace(/\D/g, '')
    return cleaned.length === 11 && /^\d{11}$/.test(cleaned)
  }

  /**
   * Valida se o email tem formato válido
   */
  get isValidEmailFormat(): boolean {
    if (!this.email) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(this.email)
  }

  /**
   * Carrega o relacionamento de role se não estiver carregado
   */
  private async ensureRoleLoaded(): Promise<void> {
    if (!this.role || !this.role.id) {
      await this.load('role' as any)
    }
  }

  /**
   * Verifica se o usuário tem permissão para uma ação em um módulo
   * @param module - Módulo do sistema
   * @param action - Ação (create, read, update, delete)
   */
  async can(module: keyof Permission, action: string): Promise<boolean> {
    await this.ensureRoleLoaded()
    return this.role?.can(module, action) ?? false
  }

  /**
   * Verifica se o usuário pode criar no módulo
   */
  async canCreate(module: keyof Permission): Promise<boolean> {
    return this.can(module, 'create')
  }

  /**
   * Verifica se o usuário pode ler/visualizar no módulo
   */
  async canRead(module: keyof Permission): Promise<boolean> {
    return this.can(module, 'read')
  }

  /**
   * Verifica se o usuário pode atualizar no módulo
   */
  async canUpdate(module: keyof Permission): Promise<boolean> {
    return this.can(module, 'update')
  }

  /**
   * Verifica se o usuário pode deletar no módulo
   */
  async canDelete(module: keyof Permission): Promise<boolean> {
    return this.can(module, 'delete')
  }

  /**
   * Verifica se o usuário é administrador
   */
  async isAdmin(): Promise<boolean> {
    await this.ensureRoleLoaded()
    return this.role?.isAdmin ?? false
  }

  /**
   * Verifica se o usuário é gerente
   */
  async isManager(): Promise<boolean> {
    await this.ensureRoleLoaded()
    return this.role?.isManager ?? false
  }

  /**
   * Verifica se o usuário é funcionário
   */
  async isEmployee(): Promise<boolean> {
    await this.ensureRoleLoaded()
    return this.role?.isEmployee ?? false
  }

  /**
   * Verifica se o usuário tem um dos papéis especificados
   * @param roles - Array de nomes de papéis
   */
  async hasAnyRole(roles: string[]): Promise<boolean> {
    await this.ensureRoleLoaded()
    const roleName = this.role?.name
    return roleName ? roles.includes(roleName) : false
  }

  /**
   * Verifica se o usuário tem permissão total em um módulo
   * @param module - Módulo do sistema
   */
  async hasFullAccess(module: keyof Permission): Promise<boolean> {
    const [create, read, update, deleteAccess] = await Promise.all([
      this.canCreate(module),
      this.canRead(module),
      this.canUpdate(module),
      this.canDelete(module),
    ])

    return create && read && update && deleteAccess
  }

  /**
   * Retorna o nome da role do usuário
   */
  async getRoleName(): Promise<string> {
    await this.ensureRoleLoaded()
    return this.role?.name ?? 'Sem função'
  }

  /**
   * Retorna a descrição da role do usuário
   */
  async getRoleDescription(): Promise<string | null> {
    await this.ensureRoleLoaded()
    return this.role?.description ?? null
  }
}
