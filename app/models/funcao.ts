import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Funcionario from './funcionario.js'

export default class Funcao extends BaseModel {
  static table = 'tavolo.funcoes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Funcionario, {
    pivotTable: 'funcionario_funcoes',
    pivotForeignKey: 'funcao_id',
    pivotRelatedForeignKey: 'funcionario_id',
    pivotTimestamps: true,
  })
  declare funcionarios: ManyToMany<typeof Funcionario>
}
