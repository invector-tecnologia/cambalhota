import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import type { ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Funcao from './funcao.js'
import Empresa from './empresa.js'

export default class Funcionario extends BaseModel {
  static table = 'tavolo.funcionarios'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare name: string

  @column()
  declare cpf: string | null

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column.date()
  declare hireDate: DateTime | null

  @column()
  declare active: boolean

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Empresa)
  declare empresa: BelongsTo<typeof Empresa>

  @manyToMany(() => Funcao, {
    pivotTable: 'funcionario_funcoes',
    pivotForeignKey: 'funcionario_id',
    pivotRelatedForeignKey: 'funcao_id',
    pivotTimestamps: true,
  })
  declare funcoes: ManyToMany<typeof Funcao>

  /**
   * Verifica se o funcionário tem uma função específica
   */
  async hasFuncao(funcaoName: string): Promise<boolean> {
    if (!this.funcoes || !Array.isArray(this.funcoes) || this.funcoes.length === 0) {
      await this.load('funcoes' as any)
    }
    return this.funcoes.some((f) => f.name === funcaoName)
  }
}
