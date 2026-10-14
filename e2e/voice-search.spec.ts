import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('storefront:mock-settings', JSON.stringify({ latencyMs: 0, errorRate: 0 }))

    // Headless Chromium can't listen, so a fake recognizer stands in and the test speaks through it
    class FakeRecognition extends EventTarget {
      lang = ''
      interimResults = false
      continuous = false
      start() {
        Reflect.set(window, 'fakeRecognition', this)
      }
      stop() {
        this.dispatchEvent(new Event('end'))
      }
      abort() {
        this.dispatchEvent(new Event('end'))
      }
    }
    // Current Chromium has the unprefixed name; older versions and Safari only the prefixed one
    Reflect.set(window, 'SpeechRecognition', FakeRecognition)
    Reflect.set(window, 'webkitSpeechRecognition', FakeRecognition)
  })
})

/** The shopper says `words`; `isFinal` when they've stopped talking */
async function say(page: Page, words: string, isFinal: boolean) {
  await page.evaluate(
    ({ transcript, final }) => {
      const recognition: unknown = Reflect.get(window, 'fakeRecognition')
      if (!(recognition instanceof EventTarget)) throw new Error('Voice search never started')
      const result = Object.assign([{ transcript }], { isFinal: final })
      recognition.dispatchEvent(Object.assign(new Event('result'), { results: [result] }))
      if (final) recognition.dispatchEvent(new Event('end'))
    },
    { transcript: words, final: isFinal },
  )
}

test('dictate a search from the header', async ({ page }) => {
  await page.goto('/')
  const searchbox = page.getByRole('searchbox', { name: 'Search products' })

  await page.getByRole('button', { name: 'Search by voice' }).click()
  await expect(searchbox).toHaveAttribute('placeholder', 'Listening…')

  await say(page, 'something to boil', false)
  await expect(searchbox).toHaveValue('something to boil')
  await say(page, 'something to boil water for tea', true)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Results for “something to boil water for tea”',
  )
  await expect(page.getByRole('button', { name: 'Search by voice' })).toBeVisible()
})

test('stop dictating with Escape', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Search by voice' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('button', { name: 'Search by voice' })).toBeVisible()
  await expect(page).toHaveURL('/')
})
