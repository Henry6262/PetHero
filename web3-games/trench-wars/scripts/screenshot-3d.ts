import { chromium } from '@playwright/test'

const GAME_W = 540
const GAME_H = 1110

async function main() {
  const browser = await chromium.launch({ args: ['--use-gl=angle'] })
  const page = await browser.newPage({ viewport: { width: 620, height: 1240 } })
  page.on('console', (m) => console.log('PAGE:', m.text().slice(0, 160)))
  page.on('pageerror', (e) => console.log('ERROR:', e.message))
  await page.goto('http://localhost:5174/')
  await page.waitForTimeout(2500)

  const rect = await page.evaluate(() => {
    const c = document.querySelector('#app canvas') as HTMLCanvasElement
    const r = c.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  })
  const click = async (gx: number, gy: number) => {
    const s = rect.height / GAME_H
    await page.mouse.click(rect.left + gx * s, rect.top + gy * s)
  }

  await click(GAME_W / 2, 410) // PLAY AS GUEST
  await page.waitForTimeout(1500)
  await click(GAME_W / 2, 340) // PRACTICE VS AI
  await page.waitForFunction(() => (window as any).__TRENCH_READY__, undefined, { timeout: 15000 })
  await page.waitForTimeout(6000) // let 3D assets load + first units deploy

  // deploy a couple of units so the screenshot shows characters
  await click(GAME_W * 0.25, 700)
  await page.waitForTimeout(400)
  await click(GAME_W * 0.75, 700)
  await page.waitForTimeout(4000)

  await page.screenshot({ path: '/tmp/tw3d.png' })
  console.log('saved /tmp/tw3d.png')

  // drag card 0 onto own half — deploy preview disc should appear
  const s = rect.height / GAME_H
  await page.mouse.move(rect.left + 70 * s, rect.top + 1060 * s)
  await page.mouse.down()
  await page.mouse.move(rect.left + 200 * s, rect.top + 750 * s, { steps: 8 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/tmp/tw3d-drag.png' })
  console.log('saved /tmp/tw3d-drag.png')
  await page.mouse.up()

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
