const pg = require('pg')

const client = new pg.Client({
  connectionString: 'postgres://ucsbkhce1pg2p8:peae319d419bcac9e25020fc6e09f9a2a5f8fb4f7fc97ed22aab527b3c572162f@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d9u6v6aufv4cqf',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  
  console.log('--- adonis_schema ---')
  const res = await client.query('SELECT * FROM tavolo.adonis_schema')
  console.log(res.rows)
  
  console.log('--- tables in tavolo ---')
  const res2 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'tavolo'")
  console.log(res2.rows.map(r => r.table_name))
  
  await client.end()
}
run()
