import { Client } from 'pg'

const usage = () => {
  console.error(
    'Usage: node scripts/query_nfce_status.mjs --access-key=<chave> | --venda-id=<id>'
  )
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  let accessKey
  let vendaId
  let listAll = false

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--access-key=')) {
      accessKey = arg.split('=')[1]
      continue
    }
    if (arg === '--access-key') {
      accessKey = args[i + 1]
      i += 1
    }
    if (arg.startsWith('--venda-id=')) {
      vendaId = arg.split('=')[1]
      continue
    }
    if (arg === '--venda-id') {
      vendaId = args[i + 1]
      i += 1
    }
    if (arg === '--list-all') {
      listAll = true
    }
  }

  return { accessKey, vendaId, listAll }
}

const main = async () => {
  const { accessKey, vendaId, listAll } = parseArgs()
  if (!accessKey && !vendaId) {
    usage()
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao configurada')
  }

  const ssl = process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
  const client = new Client({ connectionString: databaseUrl, ssl })

  await client.connect()
  try {
    let result
    if (accessKey) {
      result = await client.query(
        `SELECT id, status, access_key, protocol_number, uf, numero, serie, error_log, created_at
         FROM fiscal_notes
         WHERE access_key = $1
         LIMIT 1`,
        [accessKey]
      )
    } else {
      const limitClause = listAll ? '' : 'LIMIT 1'
      result = await client.query(
        `SELECT id, status, access_key, protocol_number, uf, numero, serie, error_log, created_at
         FROM fiscal_notes
         WHERE venda_id = $1
         ORDER BY created_at DESC
         ${limitClause}`,
        [vendaId]
      )
    }

    if (!result.rows.length) {
      const keyLabel = accessKey ? `access_key=${accessKey}` : `venda_id=${vendaId}`
      throw new Error(`Nenhuma nota encontrada para ${keyLabel}`)
    }

    const notes = listAll ? result.rows : [result.rows[0]]
    console.log('Status NFC-e (banco):')
    for (const note of notes) {
      console.log(`- fiscalNoteId: ${note.id}`)
      console.log(`  status: ${note.status}`)
      console.log(`  accessKey: ${note.access_key}`)
      console.log(`  protocolNumber: ${note.protocol_number || 'N/A'}`)
      console.log(`  uf: ${note.uf || 'N/A'}`)
      console.log(`  numero: ${note.numero || 'N/A'}`)
      console.log(`  serie: ${note.serie || 'N/A'}`)
      console.log(`  createdAt: ${note.created_at}`)
      console.log(`  errorLog: ${note.error_log ? JSON.stringify(note.error_log) : 'N/A'}`)
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  console.error(`[query_nfce_status] ${message}`)
  process.exit(1)
})
