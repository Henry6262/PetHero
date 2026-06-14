import { test, expect } from '@playwright/test'

test('landing shows brand and PLAY drops into the game menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TRENCH ROYALE' })).toBeVisible()
  await page.getByRole('button', { name: /play now/i }).first().click()
  await expect(page.getByText(/guest|connect wallet|practice/i).first()).toBeVisible()
})
