import { expect, test, type Page } from '@playwright/test'

// One page for the whole file, so the search model downloads once instead of once per test
test.describe.configure({ mode: 'serial' })

let page: Page

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('storefront:mock-settings', JSON.stringify({ latencyMs: 0, errorRate: 0 }))
  })
  // The app starts downloading the model when it's idle; wait for it so searches use it
  const modelLoaded = page.waitForResponse((response) => response.url().endsWith('.onnx'), {
    timeout: 60_000,
  })
  await page.goto('/')
  await modelLoaded
})

test.afterAll(async () => {
  await page.close()
})

const results = () => page.getByRole('region', { name: 'Results' }).getByRole('article')

async function search(query: string) {
  const searchbox = page.getByRole('searchbox', { name: 'Search products' })
  await searchbox.fill(query)
  await searchbox.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Results for “${query}”`)
}

test('describing a task finds the products for it', async () => {
  await search(
    'I need something to chop my vegetables and keep the peels separate so they can go in a different bag',
  )

  await expect(results().filter({ hasText: 'Prep Board with Scrap Drawer' })).not.toHaveCount(0)
  await expect(results().filter({ hasText: 'Compost Caddy' })).not.toHaveCount(0)
})

test('a request with no shared words still finds the right products', async () => {
  // Keyword search would match "floor" to floor lamps
  await search('keep my bathroom floor dry')

  await expect(results().filter({ hasText: /Bath Mat|Shower Curtain/ })).not.toHaveCount(0)
  await expect(results().filter({ hasText: 'Lamp' })).toHaveCount(0)
})

test('descriptive searches stay on topic', async () => {
  await search('something to boil water for tea')
  await expect(results()).not.toHaveCount(0)
  for (const name of await results().getByRole('heading').allTextContents()) {
    expect(name).toMatch(/Kettle/)
  }

  await search('cosy throw for the sofa')
  await expect(results().first()).toContainText('Throw Blanket')
})

test('gibberish shows the empty state', async () => {
  await search('qwzx')
  await expect(page.getByRole('heading', { name: 'No results for “qwzx”' })).toBeVisible()
})
