import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'

export default class Fornecedor extends BaseModel {
  static table = 'tavolo.fornecedores'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare name: string

  @column()
  declare tradeName: string | null

  @column()
  declare document: string

  @column()
  declare documentType: 'cpf' | 'cnpj'

  @column()
  declare ie: string | null

  @column()
  declare address: string | null

  @column()
  declare addressNumber: string | null

  @column()
  declare addressComplement: string | null

  @column()
  declare neighborhood: string | null

  @column()
  declare city: string | null

  @column()
  declare state: string | null

  @column()
  declare zipCode: string | null

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare contactPerson: string | null

  @column()
  declare notes: string | null

  @column()
  declare paymentTerms: 'vista' | '7d' | '15d' | '30d' | '45d' | '60d'

  @column()
  declare active: boolean

  @column()
  declare createdBy: number | null

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  // Getters
  get formattedDocument(): string {
    if (this.documentType === 'cpf') {
      return this.document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      return this.document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  get fullAddress(): string {
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

  // Métodos
  static async findByDocument(document: string, companyId?: number) {
    const query = this.query().where('document', document)

    if (companyId) {
      query.where('companyId', companyId)
    }

    return query.first()
  }

  static async activeFornecedors(companyId: number) {
    return this.query().where('companyId', companyId).where('active', true).orderBy('name')
  }
}
