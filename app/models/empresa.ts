import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Empresa extends BaseModel {
  static table = 'tavolo.empresas'

  @column({ isPrimary: true })
  declare id: number

  // Dados básicos
  @column()
  declare razaoSocial: string

  @column()
  declare tradeName: string | null

  @column()
  declare cnpj: string | null

  @column()
  declare cpf: string | null

  @column()
  declare documentType: 'cpf' | 'cnpj'

  @column()
  declare ie: string | null

  @column()
  declare im: string | null

  @column()
  declare regimeTributario: number

  @column()
  declare codMunicipio: string | null

  // Endereço
  @column()
  declare address: string

  @column()
  declare addressNumber: string | null

  @column()
  declare addressComplement: string | null

  @column()
  declare neighborhood: string

  @column()
  declare city: string

  @column()
  declare state: string

  @column()
  declare zipCode: string

  // Contato
  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare website: string | null

  // Status
  @column()
  declare active: boolean

  // Configurações de impressão de nota fiscal
  @column()
  declare logoUrl: string | null

  @column()
  declare notaFiscalFooterMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  // Alias para compatibilidade (name -> razaoSocial)
  get name() {
    return this.razaoSocial
  }

  // Métodos úteis
  get formattedDocument() {
    if (this.documentType === 'cpf' && this.cpf) {
      return this.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    if (this.documentType === 'cnpj' && this.cnpj) {
      return this.formattedCnpj
    }
    return ''
  }

  get formattedCnpj() {
    if (!this.cnpj) return ''
    return this.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  get fullAddress() {
    const parts = [
      this.address,
      this.addressNumber,
      this.addressComplement,
      this.neighborhood,
      this.city,
      this.state,
    ].filter(Boolean)

    return parts.join(', ')
  }
}
