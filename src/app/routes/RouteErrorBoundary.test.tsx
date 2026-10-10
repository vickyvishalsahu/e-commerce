import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/http'
import { renderRoute } from '@/test/render'
import { RouteErrorBoundary } from './RouteErrorBoundary'

function routesWithLoader(loader: () => unknown) {
  return [
    {
      path: '/',
      loader,
      Component: () => <h1>Loaded</h1>,
      ErrorBoundary: RouteErrorBoundary,
    },
  ]
}

describe('RouteErrorBoundary', () => {
  it('shows the server message and recovers when Try again succeeds', async () => {
    let attempts = 0
    const { user } = renderRoute(
      '/',
      routesWithLoader(() => {
        attempts += 1
        if (attempts === 1) {
          throw new ApiError(500, {
            code: 'server_error',
            message: 'The server is having a moment.',
          })
        }
        return null
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('The server is having a moment.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Loaded' })).toBeInTheDocument()
  })

  it('shows the not found page for 404 errors', async () => {
    renderRoute(
      '/',
      routesWithLoader(() => {
        throw new ApiError(404, { code: 'not_found', message: 'Product not found' })
      }),
    )

    expect(
      await screen.findByRole('heading', { name: "We can't find that page" }),
    ).toBeInTheDocument()
  })

  it('does not leak raw error messages from unexpected errors', async () => {
    renderRoute(
      '/',
      routesWithLoader(() => {
        throw new Error('Cannot read properties of undefined')
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't load this page. Check your connection and try again.",
    )
  })
})
