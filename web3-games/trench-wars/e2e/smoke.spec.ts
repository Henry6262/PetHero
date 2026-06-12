import { test, expect } from '@playwright/test'

test('app boots: menu renders and signals ready', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('TRENCH WARS')
  await expect(page.locator('[data-testid=guest]')).toBeVisible()
  await page.waitForFunction(() => (window as any).__TRENCH_READY__ === true, undefined, { timeout: 10_000 })
})
