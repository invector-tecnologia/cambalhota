import pg from 'pg'
const { Client } = pg

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida')
  process.exit(1)
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function markMigrationsAsCompleted() {
  try {
    await client.connect()
    console.log('✅ Conectado ao banco')

    // Marcar migrations como completadas
    const migrations = [
      'database/migrations/1738445000000_add_comanda_to_fiscal_notes',
      'database/migrations/1738445100000_fix_comanda_id_fiscal_notes'
    ]

    for (const migration of migrations) {
      // Verificar se já existe
      const check = await client.query(
        'SELECT * FROM adonis_schema WHERE name = $1',
        [migration]
      )

      if (check.rowCount === 0) {
        const result = await client.query(`
          INSERT INTO adonis_schema (name, batch, migration_time) 
          VALUES ($1, (SELECT COALESCE(MAX(batch), 0) + 1 FROM adonis_schema), NOW())
        `, [migration])

        console.log(`✅ Migração marcada: ${migration}`)
      } else {
        console.log(`ℹ️  Migração já existia: ${migration}`)
      }
    }

    await client.end()
    console.log('✅ Concluído!')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

markMigrationsAsCompleted()
