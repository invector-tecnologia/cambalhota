import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type ForeignKeyReference = {
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
}

type SqlBinding = string | number | boolean | Date

type DeleteScope = {
  table: string
  primaryColumn: string
  whereSql: string
  bindings: SqlBinding[]
}

export default class EmpresaDeletionService {
  async logicalDelete(empresaId: number) {
    await db.transaction(async (trx) => {
      await trx
        .from('users')
        .where('empresa_id', empresaId)
        .update({ status: 'inactive', updated_at: trx.raw('CURRENT_TIMESTAMP') })

      await trx
        .from('empresas')
        .where('id', empresaId)
        .update({ active: false, updated_at: trx.raw('CURRENT_TIMESTAMP') })
    })
  }

  async permanentDelete(empresaId: number) {
    await db.transaction(async (trx) => {
      const foreignKeys = await this.loadForeignKeys(trx)
      const tablesWithId = await this.loadTablesWithIdColumn(trx)

      await this.deleteByDependencies(
        trx,
        {
          table: 'empresas',
          primaryColumn: 'id',
          whereSql: '"id" = ?',
          bindings: [empresaId],
        },
        foreignKeys,
        tablesWithId,
        new Set()
      )
    })
  }

  private async loadForeignKeys(trx: TransactionClientContract): Promise<ForeignKeyReference[]> {
    const result = await trx.rawQuery(
      `
      SELECT
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = current_schema()
      `
    )

    const rows = result.rows ?? []
    return rows.map((row: any) => ({
      sourceTable: String(row.source_table),
      sourceColumn: String(row.source_column),
      targetTable: String(row.target_table),
      targetColumn: String(row.target_column),
    }))
  }

  private async loadTablesWithIdColumn(trx: TransactionClientContract): Promise<Set<string>> {
    const result = await trx.rawQuery(
      `
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND column_name = 'id'
      `
    )

    const rows = result.rows ?? []
    return new Set(rows.map((row: any) => String(row.table_name)))
  }

  private async deleteByDependencies(
    trx: TransactionClientContract,
    scope: DeleteScope,
    foreignKeys: ForeignKeyReference[],
    tablesWithId: Set<string>,
    visitedScopes: Set<string>
  ) {
    const visitKey = `${scope.table}|${scope.primaryColumn}|${scope.whereSql}|${JSON.stringify(scope.bindings)}`
    if (visitedScopes.has(visitKey)) {
      return
    }

    visitedScopes.add(visitKey)

    const dependents = foreignKeys.filter(
      (fk) =>
        fk.targetTable === scope.table &&
        fk.targetColumn === scope.primaryColumn &&
        fk.sourceTable !== scope.table
    )

    for (const dependent of dependents) {
      const dependentWhereSql =
        `"${dependent.sourceColumn}" IN (` +
        `SELECT "${scope.primaryColumn}" FROM "${scope.table}" WHERE ${scope.whereSql}` +
        `)`

      if (tablesWithId.has(dependent.sourceTable)) {
        await this.deleteByDependencies(
          trx,
          {
            table: dependent.sourceTable,
            primaryColumn: 'id',
            whereSql: dependentWhereSql,
            bindings: scope.bindings,
          },
          foreignKeys,
          tablesWithId,
          visitedScopes
        )
      }

      await trx.from(dependent.sourceTable).whereRaw(dependentWhereSql, scope.bindings).delete()
    }

    await trx.from(scope.table).whereRaw(scope.whereSql, scope.bindings).delete()
  }
}
