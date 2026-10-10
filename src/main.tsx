import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from '@/App'

// The mock API is the only backend, so it runs in production builds too
async function enableMocking() {
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD })
}

async function bootstrap() {
  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Missing #root element')

  await enableMocking()

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
