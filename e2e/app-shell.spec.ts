import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('storefront:mock-settings', JSON.stringify({ latencyMs: 0, errorRate: 0 }))
  })
})

test('header shows categories and an empty cart', async ({ page }) => {
  await page.goto('/')

  const categories = page.getByRole('navigation', { name: 'Categories' })
  await expect(categories.getByRole('link')).toHaveCount(8)
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible()
})

test('category links navigate client-side and mark the active category', async ({ page }) => {
  await page.goto('/')

  await page
    .getByRole('navigation', { name: 'Categories' })
    .getByRole('link', { name: 'Lighting' })
    .click()

  await expect(page).toHaveURL('/shop/lighting')
  await expect(page.getByRole('link', { name: 'Lighting' })).toHaveAttribute('aria-current', 'page')
})

test('search submits to the search page and keeps the query in the field', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('searchbox', { name: 'Search products' })

  await search.fill('linen throw')
  await search.press('Enter')

  await expect(page).toHaveURL('/search?q=linen+throw')
  await expect(search).toHaveValue('linen throw')
})

test('unknown pages show a not found page with a way home', async ({ page }) => {
  await page.goto('/definitely-not-a-page')

  await expect(page).toHaveTitle('Page not found · Storefront')
  await page.getByRole('link', { name: 'Back to the homepage' }).click()
  await expect(page).toHaveURL('/')
})

test('the skip link is the first thing keyboard users reach', async ({ page }) => {
  await page.goto('/')
  // The app mounts after the mock service worker starts, so wait for it before tabbing
  await expect(page.getByRole('link', { name: 'Storefront', exact: true })).toBeVisible()

  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
})

test('on a phone the search field sits below the logo at full width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const logo = await page.getByRole('link', { name: 'Storefront', exact: true }).boundingBox()
  const search = await page.getByRole('searchbox', { name: 'Search products' }).boundingBox()

  expect(search?.y).toBeGreaterThan((logo?.y ?? 0) + (logo?.height ?? 0))
  expect(search?.width).toBeGreaterThan(300)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
