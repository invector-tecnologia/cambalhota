import pg from 'pg';
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  let tables = await client.query(`
    SELECT table_schema, table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'tavolo'
  `);
  console.log('Tables in tavolo:', tables.rows);
  let seqs = await client.query(`
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'tavolo'
  `);
  console.log('Sequences in tavolo:', seqs.rows);
  await client.end();
}
run();
