import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetDatabase } from '@/mocks/db'
import { server } from '@/mocks/node'

// Route tests render full pages in StrictMode; under parallel load they can take over the 1s default
configure({ asyncUtilTimeout: 5000 })

// jsdom has no matchMedia; components that read media queries (the toaster) need one
window.matchMedia ??= (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
})

// jsdom doesn't implement scrolling; ScrollRestoration calls it on every navigation
window.scrollTo = () => undefined

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
  resetDatabase()
})

afterAll(() => {
  server.close()
})
