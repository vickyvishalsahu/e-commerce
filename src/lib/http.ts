import type { z } from 'zod'
import { CART_ID_HEADER } from '@/lib/schemas/cart'
import { apiErrorSchema, type ApiError as ApiErrorBody } from '@/lib/schemas/common'
import { getGuestCartId } from '@/lib/session'

type ApiErrorDetails = ApiErrorBody['error']

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorDetails['code']
  readonly fieldErrors: ApiErrorDetails['fieldErrors']
  readonly unavailableItems: ApiErrorDetails['unavailableItems']

  constructor(status: number, details: ApiErrorDetails) {
    super(details.message)
    this.name = 'ApiError'
    this.status = status
    this.code = details.code
    this.fieldErrors = details.fieldErrors
    this.unavailableItems = details.unavailableItems
  }
}

async function toApiError(response: Response) {
  const body: unknown = await response.json().catch(() => undefined)
  const parsed = apiErrorSchema.safeParse(body)
  return new ApiError(
    response.status,
    parsed.success
      ? parsed.data.error
      : { code: 'server_error', message: 'Something went wrong on our end. Try again.' },
  )
}

interface RequestOptions<T extends z.ZodType> {
  schema: T
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

/** Fetches from the API and parses the response with `schema`. Non-2xx responses throw ApiError. */
export async function request<T extends z.ZodType>(
  path: string,
  { schema, method = 'GET', body, signal }: RequestOptions<T>,
): Promise<z.infer<T>> {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  const cartId = getGuestCartId()
  if (cartId) headers.set(CART_ID_HEADER, cartId)

  const response = await fetch(new URL(path, window.location.origin), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })
  if (!response.ok) throw await toApiError(response)

  const data: unknown = response.status === 204 ? null : await response.json()
  return schema.parse(data)
}
