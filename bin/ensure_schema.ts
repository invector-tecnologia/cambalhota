import pg from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.log('No DATABASE_URL found, skipping schema creation')
  process.exit(0)
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function run() {
  await client.connect()
  
  await client.query('CREATE SCHEMA IF NOT EXISTS tavolo')
  
  // Find all tables in public schema and move them to tavolo
  const tablesRes = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename NOT IN ('spatial_ref_sys')
  `)
  
  for (const row of tablesRes.rows) {
    try {
      await client.query(`ALTER TABLE public."${row.tablename}" SET SCHEMA tavolo`)
      console.log(`Moved table ${row.tablename} to schema tavolo`)
    } catch (e: any) {
      console.error(`Failed to move table ${row.tablename}:`, e.message)
    }
  }

  // Find all sequences in public schema and move them to tavolo
  const seqsRes = await client.query(`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  `)
  
  for (const row of seqsRes.rows) {
    try {
      await client.query(`ALTER SEQUENCE public."${row.sequence_name}" SET SCHEMA tavolo`)
      console.log(`Moved sequence ${row.sequence_name} to schema tavolo`)
    } catch (e: any) {
      console.error(`Failed to move sequence ${row.sequence_name}:`, e.message)
    }
  }
  
  // Find all views in public schema and move them to tavolo
  const viewsRes = await client.query(`
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name NOT IN ('pg_stat_statements', 'pg_stat_statements_info')
  `)
  
  for (const row of viewsRes.rows) {
    try {
      await client.query(`ALTER VIEW public."${row.table_name}" SET SCHEMA tavolo`)
      console.log(`Moved view ${row.table_name} to schema tavolo`)
    } catch (e: any) {
      console.error(`Failed to move view ${row.table_name}:`, e.message)
    }
  }

  // Recovery: If adonis_schema is gone but the tables exist, populate adonis_schema
  let rolesExists = false
  try {
    await client.query('SELECT 1 FROM tavolo.roles LIMIT 1')
    rolesExists = true
    console.log('Found tavolo.roles table - database is already migrated to tavolo')
  } catch (err: any) {
    console.log('tavolo.roles check failed (probably does not exist):', err.message)
  }

  if (rolesExists) {
    console.log('Populating adonis_schema with all permutations...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS tavolo.adonis_schema (
        id serial primary key,
        name varchar(255) not null,
        batch integer not null,
        migration_time timestamptz default CURRENT_TIMESTAMP
      )
    `)
    
    const permutations = [
      'database/migrations/1900000000001_create_schema_and_extensions',
      'database/migrations/1900000000002_create_core_tables',
      'database/migrations/1900000000003_create_users_table',
      'database/migrations/1900000000004_create_supplier_and_inventory_tables',
      'database/migrations/1900000000005_create_menu_tables',
      'database/migrations/1900000000006_create_operations_tables',
      'database/migrations/1900000000007_create_financial_tables',
      'database/migrations/1900000000008_create_fiscal_tables',
      'database/migrations/1900000000009_create_processing_tables',
      'database/migrations/1900000000010_create_platform_tables',
      'database/migrations/1900000000001_create_schema_and_extensions.ts',
      'database/migrations/1900000000002_create_core_tables.ts',
      'database/migrations/1900000000003_create_users_table.ts',
      'database/migrations/1900000000004_create_supplier_and_inventory_tables.ts',
      'database/migrations/1900000000005_create_menu_tables.ts',
      'database/migrations/1900000000006_create_operations_tables.ts',
      'database/migrations/1900000000007_create_financial_tables.ts',
      'database/migrations/1900000000008_create_fiscal_tables.ts',
      'database/migrations/1900000000009_create_processing_tables.ts',
      'database/migrations/1900000000010_create_platform_tables.ts'
    ]
    
    for (const name of permutations) {
      const exists = await client.query('SELECT 1 FROM tavolo.adonis_schema WHERE name = $1', [name])
      if (exists.rows.length === 0) {
        await client.query('INSERT INTO tavolo.adonis_schema (name, batch) VALUES ($1, 1)', [name])
      }
    }
  }
  
  await client.end()
  console.log('Schema tavolo ensured and migration tracking fixed')
}

run().catch((err) => {
  console.error('Failed to create schema', err)
  process.exit(1)
})
