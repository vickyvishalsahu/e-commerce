import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/http'

const MAX_RETRIES = 2

/** Retry server errors and network failures; client errors and contract violations won't fix themselves. */
export function isRetryableError(error: unknown) {
  if (error instanceof ApiError) return error.status >= 500
  return error instanceof TypeError
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
      },
      mutations: {
        retry: false,
      },
    },
  })
}
