import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import forge from 'node-forge'
import { Client } from 'pg'
import { createDecipheriv } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import https from 'node:https'
import axios from 'axios'
import { Readable } from 'node:stream'
import path from 'node:path'

const usage = () => {
  console.error(
    'Usage: node scripts/query_sefaz_status.mjs --access-key=<chave> --state=RJ --homologation=true [--establishment-id=1] [--url=<endpoint>]'
  )
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const result = {
    accessKey: undefined,
    state: undefined,
    homologation: undefined,
    establishmentId: undefined,
    url: undefined,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--access-key=')) {
      result.accessKey = arg.split('=')[1]
      continue
    }
    if (arg === '--access-key') {
      result.accessKey = args[i + 1]
      i += 1
      continue
    }
    if (arg.startsWith('--state=')) {
      result.state = arg.split('=')[1]
      continue
    }
    if (arg === '--state') {
      result.state = args[i + 1]
      i += 1
      continue
    }
    if (arg.startsWith('--homologation=')) {
      const value = arg.split('=')[1]
      result.homologation = value === 'true' || value === '1'
      continue
    }
    if (arg === '--homologation') {
      const value = args[i + 1]
      result.homologation = value === 'true' || value === '1'
      i += 1
      continue
    }
    if (arg.startsWith('--establishment-id=')) {
      result.establishmentId = Number(arg.split('=')[1])
      continue
    }
    if (arg === '--establishment-id') {
      result.establishmentId = Number(args[i + 1])
      i += 1
      continue
    }
    if (arg.startsWith('--url=')) {
      result.url = arg.split('=')[1]
      continue
    }
    if (arg === '--url') {
      result.url = args[i + 1]
      i += 1
    }
  }

  return result
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

const loadCertificateFromDb = async (establishmentId) => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao configurada para buscar certificado')
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
    return { certificatePath, certificatePassword }
  } finally {
    await client.end()
  }
}

const extractCertAndKey = (pfxData, password) => {
  const p12 = forge.asn1.fromDer(pfxData.toString('binary'), false)
  const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12, false, password)
  const keyBags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })

  const privateKeyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
  const certificateBag = certBags[forge.pki.oids.certBag]?.[0]

  if (!privateKeyBag?.key || !certificateBag?.cert) {
    throw new Error('Certificado invalido ou senha incorreta')
  }

  return {
    key: forge.pki.privateKeyToPem(privateKeyBag.key),
    cert: forge.pki.certificateToPem(certificateBag.cert),
  }
}

const buildConsulta = (accessKey, tpAmb, cuf) => {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">` +
    `<soap:Header>` +
    `<nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">` +
    `<cUF>${cuf}</cUF>` +
    `<versaoDados>4.00</versaoDados>` +
    `</nfeCabecMsg>` +
    `</soap:Header>` +
    `<soap:Body>` +
    `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">` +
    `<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
    `<tpAmb>${tpAmb}</tpAmb>` +
    `<xServ>CONSULTAR</xServ>` +
    `<chNFe>${accessKey}</chNFe>` +
    `</consSitNFe>` +
    `</nfeDadosMsg>` +
    `</soap:Body>` +
    `</soap:Envelope>`
  )
}

const getEndpoints = (state, homologation) => {
  const svrsHom = {
    consultaProtocolo:
      'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
  }
  const svrsProd = {
    consultaProtocolo:
      'https://nfce.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
  }
  const svrsStates = new Set([
    'AC',
    'AL',
    'AP',
    'DF',
    'ES',
    'PB',
    'RJ',
    'RN',
    'RO',
    'RR',
    'SC',
    'SE',
    'TO',
  ])

  if (svrsStates.has(state)) {
    return homologation ? svrsHom : svrsProd
  }

  throw new Error(`Estado ${state} nao suportado no script`) 
}

const getCUF = (state) => {
  const map = {
    AC: '12',
    AL: '27',
    AP: '16',
    AM: '13',
    BA: '29',
    CE: '23',
    DF: '53',
    ES: '32',
    GO: '52',
    MA: '21',
    MT: '51',
    MS: '50',
    MG: '31',
    PA: '15',
    PB: '25',
    PR: '41',
    PE: '26',
    PI: '22',
    RJ: '33',
    RN: '24',
    RS: '43',
    RO: '11',
    RR: '14',
    SC: '42',
    SP: '35',
    SE: '28',
    TO: '17',
  }
  return map[state] || '00'
}

const main = async () => {
  const { accessKey, state, homologation, establishmentId, url } = parseArgs()
  if (!accessKey || !state || homologation === undefined) {
    usage()
    process.exit(1)
  }

  let certificatePath = process.env.FISCAL_CERTIFICATE_PATH
  let certificatePasswordRaw = process.env.FISCAL_CERTIFICATE_PASSWORD

  if (!certificatePath || !certificatePasswordRaw) {
    if (!establishmentId || Number.isNaN(establishmentId)) {
      throw new Error('FISCAL_CERTIFICATE_PATH/PASSWORD ausentes e --establishment-id nao informado')
    }
    const config = await loadCertificateFromDb(establishmentId)
    certificatePath = config.certificatePath
    certificatePasswordRaw = config.certificatePassword
  }

  if (!certificatePath || !certificatePasswordRaw) {
    throw new Error('FISCAL_CERTIFICATE_PATH e FISCAL_CERTIFICATE_PASSWORD devem estar definidos')
  }

  const certificatePassword = decryptPassword(certificatePasswordRaw)
  const pfxData = await readPfxBuffer(certificatePath)
  if (!pfxData.length) {
    throw new Error('PFX vazio')
  }

  const { cert, key } = extractCertAndKey(pfxData, certificatePassword)

  let caBundle
  const caBundlePath = process.env.FISCAL_SEFAZ_CA_BUNDLE_PATH
  if (caBundlePath) {
    const resolvedPath = caBundlePath.startsWith('/')
      ? caBundlePath
      : path.resolve(process.cwd(), caBundlePath)
    caBundle = await readFile(resolvedPath, 'utf8')
  }

  const httpsAgent = new https.Agent({
    cert,
    key,
    ca: caBundle,
    rejectUnauthorized: caBundle ? true : !homologation,
  })

  const targetUrl = url || getEndpoints(state, homologation).consultaProtocolo
  const tpAmb = homologation ? 2 : 1
  const cuf = getCUF(state)

  const soapEnvelope = buildConsulta(accessKey, tpAmb, cuf)
  const response = await axios.post(targetUrl, soapEnvelope, {
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      SOAPAction: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
    },
    httpsAgent,
    timeout: 30000,
    validateStatus: () => true,
  })

  const responseText = typeof response.data === 'string' ? response.data : String(response.data)
  if (response.status < 200 || response.status >= 300) {
    console.error(`HTTP ${response.status} ao consultar SEFAZ (${targetUrl})`)
    console.error(responseText.slice(0, 2000))
    process.exit(1)
  }

  console.log('Resposta SEFAZ:')
  console.log(responseText.slice(0, 2000))
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  console.error(`[query_sefaz_status] ${message}`)
  process.exit(1)
})
