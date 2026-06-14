import { test, expect } from '@playwright/test'

test('landing shows brand and CTA drops into the game', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TRENCH ROYALE' })).toBeVisible()
  await page.getByRole('button', { name: /build your deck/i }).first().click()
  await expect(page.getByText(/guest|connect wallet|practice/i).first()).toBeVisible()
})
