import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333'
const EMAIL = process.env.SCREENSHOT_EMAIL || process.env.EMAIL
const PASSWORD = process.env.SCREENSHOT_PASSWORD || process.env.PASSWORD
const OUT_DIR = path.resolve('.doc/images/fiscal')

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  // Tenta identificar campos genéricos
  const emailSel = 'input[type="email"], input[name="email"], #email'
  const passSel = 'input[type="password"], input[name="password"], #password'
  const submitSel = 'button[type="submit"], button:has-text("Entrar"), button:has-text("Login")'

  if (!EMAIL || !PASSWORD) {
    throw new Error('Defina as variáveis de ambiente SCREENSHOT_EMAIL e SCREENSHOT_PASSWORD')
  }

  await page.fill(emailSel, EMAIL)
  await page.fill(passSel, PASSWORD)
  await page.click(submitSel)
  await page.waitForLoadState('networkidle')
  // Verifica se dashboard carregou
  await page.waitForURL(/\/dashboard|\/?$/, { timeout: 10000 }).catch(() => {})
}

async function gotoFiscal(page) {
  await page.goto(`${BASE_URL}/fiscal`, { waitUntil: 'networkidle' })
}

async function capture(page, filename) {
  await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: true })
}

async function applyFilters(page) {
  // Preenche filtros básicos se existirem
  const startSel = 'input[name="start_date"]'
  const endSel = 'input[name="end_date"]'
  const statusSel = 'select[name="status"]'
  const filterBtnSel = 'button:has-text("Filtrar")'

  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const fmt = (d) => d.toISOString().slice(0, 10)

  if (await page.$(startSel)) await page.fill(startSel, fmt(start))
  if (await page.$(endSel)) await page.fill(endSel, fmt(today))
  if (await page.$(statusSel)) await page.selectOption(statusSel, { value: 'AUTHORIZED' }).catch(() => {})
  if (await page.$(filterBtnSel)) await page.click(filterBtnSel)
  await page.waitForLoadState('networkidle')
}

async function openFirstDetails(page) {
  const detailsBtn = 'button:has-text("Detalhes")'
  const exists = await page.$(detailsBtn)
  if (exists) {
    await exists.click()
    await page.waitForSelector('#detailsModal:not(.hidden)', { timeout: 5000 }).catch(() => {})
  }
}

async function fillExportAndClick(page) {
  const monthSel = 'input[name="month"]'
  const yearSel = 'input[name="year"]'
  const formSel = '#exportForm'
  const now = new Date()
  const month = String(now.getMonth() + 1)
  const year = String(now.getFullYear())

  if (await page.$(monthSel)) await page.fill(monthSel, month)
  if (await page.$(yearSel)) await page.fill(yearSel, year)
  if (await page.$(formSel)) await page.click('#exportForm button[type="submit"], #exportForm button')
  await page.waitForLoadState('networkidle')
}

async function main() {
  await ensureDir(OUT_DIR)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await login(page)
    await gotoFiscal(page)
    await capture(page, '01-fiscal-lista.png')

    await applyFilters(page)
    await capture(page, '02-fiscal-filtros.png')

    await openFirstDetails(page)
    await capture(page, '03-fiscal-detalhes-modal.png')

    // Mostra seção de documentos na mesma lista
    await capture(page, '04-fiscal-xml-danfe.png')

    await fillExportAndClick(page)
    await capture(page, '05-fiscal-export-zip.png')
  } finally {
    await browser.close()
  }

  console.log('✅ Screenshots salvos em', OUT_DIR)
}

main().catch((e) => {
  console.error('❌ Falha ao capturar screenshots:', e)
  process.exit(1)
})
