import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import https from 'node:https'
import AdmZip from 'adm-zip'

const XSD_URL = process.env.FISCAL_SEFAZ_XSD_URL
const TARGET_DIR = path.resolve('resources', 'xsd')
const XSD_PATH_FILE = path.join(TARGET_DIR, '.xsd_path')
const XSD_URL_FILE = path.join(TARGET_DIR, '.xsd_url')

if (!XSD_URL) {
  console.info('[download_sefaz_xsd] FISCAL_SEFAZ_XSD_URL nao definido; ignorando download')
  process.exit(0)
}

const normalizeUrl = (rawUrl) => {
  if (!rawUrl) {
    throw new Error('URL vazio para download')
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl
  }
  return `https://www.nfe.fazenda.gov.br${rawUrl}`
}

const downloadFile = async (url, destPath) => {
  await fs.mkdir(path.dirname(destPath), { recursive: true })

  return new Promise((resolve, reject) => {
    const resolvedUrl = normalizeUrl(url)
    const request = https.get(resolvedUrl, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location
        if (location) {
          response.resume()
          downloadFile(location, destPath).then(resolve).catch(reject)
          return
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download falhou (${response.statusCode}) para ${resolvedUrl}`))
        return
      }

      const fileStream = fs.open(destPath, 'w')
      fileStream.then((handle) => {
        const stream = handle.createWriteStream()
        response.pipe(stream)
        stream.on('finish', async () => {
          await handle.close()
          resolve()
        })
        stream.on('error', async (err) => {
          await handle.close()
          reject(err)
        })
      }).catch(reject)
    })

    request.on('error', reject)
  })
}

const findMainXsd = async () => {
  const entries = await fs.readdir(TARGET_DIR, { withFileTypes: true })
  const xsdFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.xsd'))
  const preferred = xsdFiles.find((entry) => entry.name.toLowerCase() === 'nfe_v4.00.xsd')
  if (preferred) {
    return path.join(TARGET_DIR, preferred.name)
  }
  if (xsdFiles.length > 0) {
    return path.join(TARGET_DIR, xsdFiles[0].name)
  }
  return null
}

const main = async () => {
  await fs.mkdir(TARGET_DIR, { recursive: true })

  const url = new URL(XSD_URL)
  const filenameFromUrl = path.basename(url.pathname) || 'nfe_v4.00.xsd'
  const tempPath = path.resolve(TARGET_DIR, filenameFromUrl)

  console.info(`[download_sefaz_xsd] Baixando ${XSD_URL}`)
  await downloadFile(XSD_URL, tempPath)

  if (filenameFromUrl.toLowerCase().endsWith('.zip')) {
    const zip = new AdmZip(tempPath)
    zip.extractAllTo(TARGET_DIR, true)
    await fs.unlink(tempPath)
    console.info(`[download_sefaz_xsd] ZIP extraido em ${TARGET_DIR}`)
  } else {
    console.info(`[download_sefaz_xsd] XSD salvo em ${tempPath}`)
  }

  const mainXsd = await findMainXsd()
  if (mainXsd) {
    await fs.writeFile(XSD_PATH_FILE, mainXsd, 'utf8')
    await fs.writeFile(XSD_URL_FILE, XSD_URL, 'utf8')
    console.info(`[download_sefaz_xsd] XSD principal: ${mainXsd}`)
  }

  console.info('[download_sefaz_xsd] Configure FISCAL_SEFAZ_XSD_PATH para o XSD principal no build')
}

main().catch((error) => {
  console.error('[download_sefaz_xsd] falha:', error)
  process.exit(1)
})
