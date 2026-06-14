import { test, expect } from '@playwright/test'

test('landing shows brand and CTA starts onboarding', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TRENCH ROYALE' })).toBeVisible()
  await page.getByRole('button', { name: /build your deck/i }).first().click()
  // Onboarding welcome appears.
  await expect(page.getByRole('button', { name: /enter the trench/i })).toBeVisible()
})
