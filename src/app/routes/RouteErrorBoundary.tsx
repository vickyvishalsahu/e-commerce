import { isRouteErrorResponse, useRevalidator, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { NotFoundPage } from './NotFoundPage'

function isNotFound(error: unknown) {
  return (
    (isRouteErrorResponse(error) && error.status === 404) ||
    (error instanceof ApiError && error.status === 404)
  )
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.status >= 500) return error.message
  return "We couldn't load this page. Check your connection and try again."
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const revalidator = useRevalidator()

  if (isNotFound(error)) return <NotFoundPage />

  return (
    <section role="alert" className="flex flex-col items-start gap-4 py-16">
      <title>Something went wrong · Storefront</title>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-prose text-muted-foreground">{errorMessage(error)}</p>
      <Button
        onClick={() => void revalidator.revalidate()}
        disabled={revalidator.state === 'loading'}
      >
        Try again
      </Button>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-4 text-xs">
          {error.stack}
        </pre>
      )}
    </section>
  )
}
