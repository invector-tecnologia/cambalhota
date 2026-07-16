import pg from 'pg'

const client = new pg.Client({
  connectionString: 'postgres://ucsbkhce1pg2p8:peae319d419bcac9e25020fc6e09f9a2a5f8fb4f7fc97ed22aab527b3c572162f@c57oa7dm3pc281.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d9u6v6aufv4cqf',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  const res = await client.query('SELECT * FROM tavolo.adonis_schema')
  console.log(res.rows)
  await client.end()
}
run()
