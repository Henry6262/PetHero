import { test, expect } from '@playwright/test'

test('landing shows brand and CTA starts onboarding', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'TRENCH ROYALE' })).toBeVisible()
  await page.getByRole('button', { name: /play/i }).first().click()
  // Onboarding welcome appears.
  await expect(page.getByRole('button', { name: /enter the trench/i })).toBeVisible()
})
