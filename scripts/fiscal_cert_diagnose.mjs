import { Client } from 'pg'
import forge from 'node-forge'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createDecipheriv } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Readable } from 'node:stream'

const usage = () => {
  console.error('Usage: node scripts/fiscal_cert_diagnose.mjs --establishment-id=1')
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  let establishmentId

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--establishment-id=')) {
      establishmentId = arg.split('=')[1]
      continue
    }
    if (arg === '--establishment-id') {
      establishmentId = args[i + 1]
      i += 1
    }
  }

  return establishmentId ? Number(establishmentId) : undefined
}

const isEncrypted = (value) => /^[0-9a-f]{32}:[0-9a-f]+$/i.test(value || '')

const decryptPassword = (value) => {
  if (!value || !isEncrypted(value)) {
    return value
  }

  const key = process.env.FISCAL_ENCRYPTION_KEY
  if (!key) {
    throw new Error('FISCAL_ENCRYPTION_KEY nao configurada para descriptografar senha')
  }

  const [ivHex, encrypted] = value.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0')), iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

const readBodyToBuffer = async (body) => {
  if (!body) {
    return Buffer.alloc(0)
  }
  if (Buffer.isBuffer(body)) {
    return body
  }
  if (typeof body === 'string') {
    return Buffer.from(body)
  }
  if (typeof body.transformToByteArray === 'function') {
    const bytes = await body.transformToByteArray()
    return Buffer.from(bytes)
  }
  if (body instanceof Readable || typeof body.pipe === 'function') {
    const chunks = []
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  return Buffer.alloc(0)
}

const getR2Client = () => {
  const bucket = process.env.R2_BUCKET
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Configuracao R2 incompleta (R2_BUCKET/R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY)')
  }

  return {
    bucket,
    client: new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
  }
}

const readPfxBuffer = async (pathOrKey) => {
  if (pathOrKey.startsWith('certificados/')) {
    const { bucket, client } = getR2Client()
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: pathOrKey,
      })
    )
    return readBodyToBuffer(result.Body)
  }

  return readFile(pathOrKey)
}

const main = async () => {
  const establishmentId = parseArgs()
  if (!establishmentId || Number.isNaN(establishmentId)) {
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
    const result = await client.query(
      'SELECT certificate_path, certificate_password FROM fiscal_configs WHERE establishment_id = $1 LIMIT 1',
      [establishmentId]
    )

    if (!result.rows.length) {
      throw new Error(`Configuracao fiscal nao encontrada para establishment_id=${establishmentId}`)
    }

    const { certificate_path: certificatePath, certificate_password: certificatePassword } = result.rows[0]
    const decryptedPassword = decryptPassword(certificatePassword)

    const pfxData = await readPfxBuffer(certificatePath)
    if (!pfxData.length) {
      throw new Error('PFX vazio no disco/R2')
    }

    const p12 = forge.asn1.fromDer(pfxData.toString('binary'), false)
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12, false, decryptedPassword)

    const shroudedKeyBags = pkcs12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    })[forge.pki.oids.pkcs8ShroudedKeyBag]

    const keyBags = pkcs12.getBags({
      bagType: forge.pki.oids.keyBag,
    })[forge.pki.oids.keyBag]

    const certBags = pkcs12.getBags({
      bagType: forge.pki.oids.certBag,
    })[forge.pki.oids.certBag]

    const privateKeyBag = shroudedKeyBags?.[0] || keyBags?.[0]
    const certificateBag = certBags?.[0]

    const privateKeyPem = privateKeyBag?.key ? forge.pki.privateKeyToPem(privateKeyBag.key) : ''
    const certificatePem = certificateBag?.cert ? forge.pki.certificateToPem(certificateBag.cert) : ''

    console.log('Diagnostico do certificado:')
    console.log(`- Path: ${certificatePath}`)
    console.log(`- PFX size: ${pfxData.length} bytes`)
    console.log(`- Private key bag: ${privateKeyBag ? 'sim' : 'nao'}`)
    console.log(`- Certificate bag: ${certificateBag ? 'sim' : 'nao'}`)
    const hasPkcs8 = privateKeyPem.includes('BEGIN PRIVATE KEY')
    const hasPkcs1 = privateKeyPem.includes('BEGIN RSA PRIVATE KEY')
    const privateKeyStatus = hasPkcs8
      ? 'ok (PKCS#8)'
      : hasPkcs1
        ? 'ok (PKCS#1)'
        : 'invalido'

    console.log(`- Private key PEM: ${privateKeyStatus}`)
    console.log(`- Certificate PEM: ${certificatePem.includes('BEGIN CERTIFICATE') ? 'ok' : 'invalido'}`)

    if (!hasPkcs8 && !hasPkcs1) {
      process.exitCode = 1
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  console.error(`[fiscal_cert_diagnose] ${message}`)
  process.exit(1)
})
