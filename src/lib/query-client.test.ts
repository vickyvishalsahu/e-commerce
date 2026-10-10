import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiError } from '@/lib/http'
import { isRetryableError } from '@/lib/query-client'

describe('isRetryableError', () => {
  it('retries server errors', () => {
    expect(isRetryableError(new ApiError(500, { code: 'server_error', message: '' }))).toBe(true)
  })

  it('retries network failures', () => {
    expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('does not retry client errors', () => {
    expect(isRetryableError(new ApiError(404, { code: 'not_found', message: '' }))).toBe(false)
  })

  it('does not retry responses that break the schema', () => {
    expect(isRetryableError(new z.ZodError([]))).toBe(false)
  })
})
