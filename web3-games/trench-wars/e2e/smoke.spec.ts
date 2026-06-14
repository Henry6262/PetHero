import { test, expect } from '@playwright/test'

test('app boots: onboarding renders and signals ready', async ({ page }) => {
  await page.goto('/')
  // Landing is now at '/'; click into onboarding.
  await page.getByRole('button', { name: /build your deck/i }).first().click()
  await expect(page.getByRole('heading', { name: 'TRENCH ROYALE' })).toBeVisible()
  await page.getByRole('button', { name: /enter the trench/i }).click()
  // Identity step offers guest login.
  await expect(page.locator('[data-testid=onboarding-guest]')).toBeVisible()
  await page.waitForFunction(() => (window as any).__TRENCH_READY__ === true, undefined, { timeout: 10_000 })
})
