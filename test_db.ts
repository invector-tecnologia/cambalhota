import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'

async function run() {
  await app.boot()
  const columns = await db.connection().rawQuery('SELECT column_name FROM information_schema.columns WHERE table_name = \'users\'')
  console.log(columns.rows)
  process.exit(0)
}
run().catch(console.error)
