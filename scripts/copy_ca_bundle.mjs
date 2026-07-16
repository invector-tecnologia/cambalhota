import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const caSourcePath = path.resolve('icp-brasil.pem')
const caTargetPath = path.resolve('build', 'icp-brasil.pem')
const xsdSourceDir = path.resolve('resources', 'xsd')
const xsdTargetDir = path.resolve('build', 'resources', 'xsd')

try {
  await fs.access(caSourcePath)
} catch {
  console.info('[copy_ca_bundle] icp-brasil.pem nao encontrado; ignorando copia')
}

try {
  await fs.copyFile(caSourcePath, caTargetPath)
  console.info(`[copy_ca_bundle] copiado para ${caTargetPath}`)
} catch (error) {
  console.error('[copy_ca_bundle] falha ao copiar:', error)
  process.exit(1)
}

try {
  await fs.access(xsdSourceDir)
} catch {
  console.info('[copy_ca_bundle] resources/xsd nao encontrado; ignorando copia')
  process.exit(0)
}

try {
  await fs.mkdir(xsdTargetDir, { recursive: true })
  const entries = await fs.readdir(xsdSourceDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }
    const sourceFile = path.join(xsdSourceDir, entry.name)
    const targetFile = path.join(xsdTargetDir, entry.name)
    await fs.copyFile(sourceFile, targetFile)
  }
  console.info(`[copy_ca_bundle] XSDs copiados para ${xsdTargetDir}`)
} catch (error) {
  console.error('[copy_ca_bundle] falha ao copiar XSD:', error)
  process.exit(1)
}
