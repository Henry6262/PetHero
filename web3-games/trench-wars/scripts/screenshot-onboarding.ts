// scripts/screenshot-onboarding.ts
// Visual smoke for the cinematic onboarding flow:
//   welcome -> identity (guest) -> lootbox (PackOpen) -> deck pick -> level-up.
// Mirrors scripts/screenshot-3d.ts conventions (chromium + angle GL, port 5174).
// Run: dev server on 5174 + backend on 3001 up, then:
//   npx tsx scripts/screenshot-onboarding.ts
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:5174'

async function main() {
  const browser = await chromium.launch({ args: ['--use-gl=angle'] })
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } })
  page.on('pageerror', (e) => console.log('ERROR:', e.message))
  await page.goto(BASE)
  await page.waitForFunction(() => (window as any).__TRENCH_READY__ === true, undefined, { timeout: 15000 })

  // welcome -> identity -> guest
  await page.getByText('ENTER THE TRENCH').click().catch(() => {})
  await page.getByTestId('onboarding-guest').click()

  // lootbox: open chest, advance reveals
  await page.waitForSelector('.chest', { timeout: 10000 })
  await page.locator('.chest').click()
  await page.waitForTimeout(1400)
  await page.screenshot({ path: '/tmp/tw-lootbox.png' })
  for (let i = 0; i < 12; i++) {
    await page.locator('.pack-reveal, .pack-summary').first().click().catch(() => {})
    await page.waitForTimeout(220)
  }
  await page.getByText('CONTINUE').click().catch(() => {})

  // deck: pick 8, deploy
  await page.waitForSelector('.onboarding-deck .tcard', { timeout: 10000 })
  await page.screenshot({ path: '/tmp/tw-deck.png' })
  const cards = await page.locator('.onboarding-deck .tcard').all()
  for (const c of cards.slice(0, 8)) await c.click().catch(() => {})
  await page.getByText('DEPLOY SQUAD').click().catch(() => {})

  // level-up
  await page.waitForSelector('.levelup-pool .tcard', { timeout: 10000 })
  await page.locator('.levelup-pool .tcard').first().click()
  await page.waitForTimeout(900)
  await page.screenshot({ path: '/tmp/tw-levelup.png' })

  await browser.close()
  console.log('screens: /tmp/tw-lootbox.png /tmp/tw-deck.png /tmp/tw-levelup.png')
}
main().catch((e) => { console.error(e); process.exit(1) })
