import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('storefront:mock-settings', JSON.stringify({ latencyMs: 0, errorRate: 0 }))
  })
})

// Options are visually hidden radios inside styled labels, so click the label like a shopper would
const option = (page: Page, name: string) =>
  page.locator('label', { has: page.getByRole('radio', { name, exact: true }) })

test('choose a variant and add it to the cart from a category', async ({ page }) => {
  await page.goto('/shop/kitchen')
  await page.getByRole('link', { name: 'Cast Iron Skillet', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cast Iron Skillet')
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible()

  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.getByRole('radio', { name: '8"' })).toBeFocused()

  await option(page, 'Black').click()
  await option(page, '10"').click()
  await expect(page).toHaveURL('/p/cast-iron-skillet?color=Black&size=10%22')
  await page.getByLabel('Quantity').selectOption('2')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect(page.getByText('Added to cart')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible()

  // The variant choice replaced history, so Back returns to the category
  await page.goBack()
  await expect(page).toHaveURL('/shop/kitchen')
})

test('the cart remembers what was added after a reload', async ({ page }) => {
  await page.goto('/p/cast-iron-skillet?color=Charcoal&size=8%22')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
})

test('product page on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/p/cast-iron-skillet')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Product images' })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('unknown products show the not found page', async ({ page }) => {
  await page.goto('/p/does-not-exist')
  await expect(page.getByRole('heading', { name: "We can't find that page" })).toBeVisible()
})
