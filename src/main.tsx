import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { AppProviders } from '@/app/AppProviders'
import { routes } from '@/app/router'
import { createQueryClient } from '@/lib/query-client'

// The mock API is the only backend, so it runs in production builds too
async function enableMocking() {
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD })
}

async function loadDevTools() {
  if (!import.meta.env.DEV) return null
  const [{ DevToolbar }, { ReactQueryDevtools }] = await Promise.all([
    import('@/mocks/DevToolbar'),
    import('@tanstack/react-query-devtools'),
  ])
  return (
    <>
      <DevToolbar />
      <ReactQueryDevtools buttonPosition="bottom-right" />
    </>
  )
}

async function bootstrap() {
  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Missing #root element')

  await enableMocking()
  const devTools = await loadDevTools()
  const queryClient = createQueryClient()
  const router = createBrowserRouter(routes)

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
        {devTools}
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
