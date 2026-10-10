import { expect, test, type Page } from '@playwright/test'
import { cartSchema } from '../src/lib/schemas/cart'
import { productListResponseSchema, productSchema } from '../src/lib/schemas/catalog'
import { apiErrorSchema } from '../src/lib/schemas/common'

async function callApi(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown; cartId?: string } = {},
) {
  return page.evaluate(
    // Runs inside the browser, so the request goes through the service worker
    async (request) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (request.cartId) headers['X-Cart-Id'] = request.cartId
      const response = await fetch(request.path, {
        method: request.method ?? 'GET',
        headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
      })
      const json: unknown = await response.json()
      return { status: response.status, json }
    },
    { path, ...init },
  )
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e:initialized')) {
      localStorage.clear()
      localStorage.setItem(
        'storefront:mock-settings',
        JSON.stringify({ latencyMs: 0, errorRate: 0 }),
      )
      sessionStorage.setItem('e2e:initialized', 'true')
    }
  })
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Storefront', exact: true })).toBeVisible()
})

test('serves the catalog from the service worker', async ({ page }) => {
  const { status, json } = await callApi(page, '/api/products?category=kitchen')

  expect(status).toBe(200)
  expect(productListResponseSchema.parse(json).total).toBe(25)
})

test('keeps cart state across a reload', async ({ page }) => {
  const products = productListResponseSchema.parse(
    (await callApi(page, '/api/products?inStock=true')).json,
  )
  const product = productSchema.parse(
    (await callApi(page, `/api/products/${products.items[0]?.slug}`)).json,
  )
  const variant = product.variants.find((v) => v.stock > 0)
  const cart = cartSchema.parse((await callApi(page, '/api/cart')).json)
  await callApi(page, '/api/cart/items', {
    method: 'POST',
    cartId: cart.id,
    body: { variantId: variant?.id, quantity: 1 },
  })

  await page.reload()
  await expect(page.getByRole('link', { name: 'Storefront', exact: true })).toBeVisible()
  const afterReload = cartSchema.parse((await callApi(page, '/api/cart', { cartId: cart.id })).json)

  expect(afterReload.items).toHaveLength(1)
})

test('simulates server errors when the error rate is set', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem(
      'storefront:mock-settings',
      JSON.stringify({ latencyMs: 0, errorRate: 1 }),
    ),
  )

  const { status, json } = await callApi(page, '/api/categories')

  expect(status).toBe(500)
  expect(apiErrorSchema.parse(json).error.code).toBe('server_error')
})
