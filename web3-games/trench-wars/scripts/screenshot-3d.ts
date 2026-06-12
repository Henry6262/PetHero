import { chromium } from '@playwright/test'

/**
 * Visual smoke for the React + 3D build.
 * Captures: menu (desktop + mobile), battle, drag-deploy preview, deck builder.
 * Needs dev server on 5174 + backend on 3001.
 */
async function main() {
  const browser = await chromium.launch({ args: ['--use-gl=angle'] })

  // mobile-sized run (the primary target)
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => console.log('ERROR:', e.message))
  await page.goto('http://localhost:5174/')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: '/tmp/tw-menu-mobile.png' })

  await page.click('[data-testid=guest]')
  await page.waitForSelector('[data-testid=practice]', { timeout: 8000 })
  await page.screenshot({ path: '/tmp/tw-menu-authed.png' })

  await page.click('[data-testid=practice]')
  await page.waitForFunction(() => (window as any).__TRENCH_READY__, undefined, { timeout: 15000 })
  await page.waitForTimeout(6500)

  // deploy two units via stage clicks (own half)
  const stage = (await page.locator('.stage').boundingBox())!
  await page.mouse.click(stage.x + stage.width * 0.3, stage.y + stage.height * 0.72)
  await page.waitForTimeout(400)
  await page.mouse.click(stage.x + stage.width * 0.7, stage.y + stage.height * 0.72)
  await page.waitForTimeout(4000)
  await page.screenshot({ path: '/tmp/tw3d.png' })
  console.log('saved /tmp/tw3d.png')

  // drag first card onto the arena — preview disc should appear
  const card = (await page.locator('.hand .card-tile').first().boundingBox())!
  await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2)
  await page.mouse.down()
  await page.mouse.move(stage.x + stage.width * 0.35, stage.y + stage.height * 0.68, { steps: 8 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/tmp/tw3d-drag.png' })
  console.log('saved /tmp/tw3d-drag.png')
  await page.mouse.up()
  await page.close()

  // desktop menu + deck builder
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await desktop.goto('http://localhost:5174/')
  await desktop.waitForTimeout(1200)
  await desktop.screenshot({ path: '/tmp/tw-menu-desktop.png' })
  const authed = await desktop.locator('[data-testid=deck]').count()
  if (authed) {
    await desktop.click('[data-testid=deck]')
    await desktop.waitForTimeout(800)
    await desktop.screenshot({ path: '/tmp/tw-deck.png' })
  }
  await browser.close()
  console.log('done')
}

main().catch((e) => { console.error(e); process.exit(1) })
