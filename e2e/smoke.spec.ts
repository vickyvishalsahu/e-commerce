import { expect, test } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Storefront')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Well-made things for every room',
  )
})
