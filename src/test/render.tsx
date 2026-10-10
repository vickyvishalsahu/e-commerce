import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/AppProviders'
import { createRoutes } from '@/app/router'

/** Renders routes (the real app routes by default) at `path` with fresh providers. */
export function renderRoute(path = '/', routes?: RouteObject[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routes ?? createRoutes(queryClient), {
    initialEntries: [path],
  })
  const user = userEvent.setup()

  // StrictMode matches main.tsx, so double-mount bugs show up in tests too
  render(
    <StrictMode>
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )

  return { router, user, queryClient }
}
