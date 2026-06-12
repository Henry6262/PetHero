import { chromium } from '@playwright/test'

/** E2E smoke against the production deployment: guest login → practice match → 3D loads. */
const PROD_URL = process.env.PROD_URL || 'https://trench-wars-henry6262s-projects.vercel.app'

async function main() {
  const browser = await chromium.launch({ args: ['--use-gl=angle'] })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
  await page.goto(PROD_URL)
  await page.waitForSelector('[data-testid=guest]', { timeout: 15000 })
  console.log('menu: OK')

  await page.click('[data-testid=guest]')
  await page.waitForSelector('[data-testid=practice]', { timeout: 15000 })
  console.log('guest login (cross-site cookie): OK')

  await page.click('[data-testid=practice]')
  await page.waitForSelector('.stage', { timeout: 10000 })
  // wait for the 3D loading screen to disappear (assets fetched + arena built)
  await page.waitForSelector('.stage .loading', { state: 'detached', timeout: 60000 })
  console.log('3D battle loaded: OK')

  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/tw-prod.png' })
  console.log('screenshot: /tmp/tw-prod.png')
  await browser.close()
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })
