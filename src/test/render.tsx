import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/AppProviders'
import { routes as appRoutes } from '@/app/router'

/** Renders routes (the real app routes by default) at `path` with fresh providers. */
export function renderRoute(path = '/', routes: RouteObject[] = appRoutes) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()

  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return { router, user, queryClient }
}
