import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('storefront:mock-settings', JSON.stringify({ latencyMs: 0, errorRate: 0 }))
  })
})

const results = (page: Page) => page.getByRole('region', { name: 'Results' }).getByRole('article')

test('browse from the home page into a category', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /Kitchen\s*25 products/ }).click()

  await expect(page).toHaveURL('/shop/kitchen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kitchen')
  await expect(results(page)).toHaveCount(24)
})

test('Back undoes a filter and restores the controls', async ({ page }) => {
  await page.goto('/shop/textiles')
  await expect(results(page)).toHaveCount(24)

  await page.getByRole('checkbox', { name: 'In stock only' }).click()
  await expect(page).toHaveURL('/shop/textiles?inStock=true')
  await page.getByLabel('Sort by').selectOption('price-desc')
  await expect(page).toHaveURL('/shop/textiles?inStock=true&sort=price-desc')

  await page.goBack()
  await expect(page).toHaveURL('/shop/textiles?inStock=true')
  await expect(page.getByLabel('Sort by')).toHaveValue('featured')

  await page.goBack()
  await expect(page).toHaveURL('/shop/textiles')
  await expect(page.getByRole('checkbox', { name: 'In stock only' })).not.toBeChecked()
})

test('changing a filter keeps the scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.goto('/shop/decor')
  await expect(results(page)).toHaveCount(24)
  await page.mouse.wheel(0, 300)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
  const before = await page.evaluate(() => window.scrollY)

  await page.getByRole('radio', { name: '3 stars & up' }).click()
  await expect(page).toHaveURL('/shop/decor?rating=3')

  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('paging returns to the top and focuses the heading', async ({ page }) => {
  await page.goto('/shop/kitchen')
  const pagination = page.getByRole('navigation', { name: 'Pagination' })
  await pagination.scrollIntoViewIfNeeded()

  await pagination.getByRole('link', { name: 'Page 2' }).click()

  await expect(page).toHaveURL('/shop/kitchen?page=2')
  await expect(results(page)).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50)
})

test('on a phone, filters open in a sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/shop/lighting')
  await expect(results(page)).toHaveCount(24)
  await expect(page.getByRole('complementary', { name: 'Filters' })).toBeHidden()

  await page.getByRole('button', { name: 'Filters' }).click()
  const sheet = page.getByRole('dialog', { name: 'Filters' })
  await sheet.getByRole('radio', { name: '4 stars & up' }).click()
  await expect(page).toHaveURL('/shop/lighting?rating=4')
  await sheet.getByRole('button', { name: /^Show \d+ products?$/ }).click()

  await expect(sheet).toBeHidden()
  await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeVisible()
})

test('search from the header lists matching products', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('searchbox', { name: 'Search products' })

  await search.fill('dutch oven')
  await search.press('Enter')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for “dutch oven”')
  await expect(results(page).first()).toContainText(/dutch oven/i)
})

test('old results stay visible while the next page loads', async ({ page }) => {
  await page.goto('/shop/bath')
  await expect(results(page)).toHaveCount(24)
  await page.evaluate(() =>
    localStorage.setItem(
      'storefront:mock-settings',
      JSON.stringify({ latencyMs: 1500, errorRate: 0 }),
    ),
  )

  await page.getByLabel('Sort by').selectOption('rating')

  await expect(page.getByRole('region', { name: 'Results' })).toHaveAttribute('aria-busy', 'true')
  await expect(results(page)).toHaveCount(24)
  await expect(page.getByRole('region', { name: 'Results' })).toHaveAttribute(
    'aria-busy',
    'false',
    {
      timeout: 5000,
    },
  )
})
