import pg from 'pg'

async function run() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tavolo',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
  
  await client.connect()
  
  const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'tavolo')
  `)
  console.log('Tables:', tables.rows)

  try {
    const adonisSchema = await client.query(`SELECT * FROM tavolo.adonis_schema`)
    console.log('tavolo.adonis_schema:', adonisSchema.rows)
  } catch(e) {
    console.log('No tavolo.adonis_schema')
  }

  try {
    const adonisSchema = await client.query(`SELECT * FROM public.adonis_schema`)
    console.log('public.adonis_schema:', adonisSchema.rows)
  } catch(e) {
    console.log('No public.adonis_schema')
  }

  await client.end()
}

run().catch(console.error)
