import { test, expect } from '@playwright/test'

test('game boots: canvas mounts and scene signals ready', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await page.waitForFunction(() => (window as any).__TRENCH_READY__ === true, undefined, { timeout: 10_000 })
})
