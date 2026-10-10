import { sessionSchema } from '@/lib/schemas/auth'
import { CART_ID_HEADER } from '@/mocks/carts'
import { demoUser } from '@/mocks/db'

interface ApiRequest {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string
  cartId?: string
}

/** Calls the mock API the same way the app will: real fetch, intercepted by MSW. */
export async function api(path: string, { method = 'GET', body, token, cartId }: ApiRequest = {}) {
  const headers = new Headers()
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (cartId) headers.set(CART_ID_HEADER, cartId)

  const response = await fetch(new URL(path, window.location.origin), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json: unknown = response.status === 204 ? null : await response.json()
  return { status: response.status, json }
}

export async function signInAsDemoUser(guestCartId?: string) {
  const { json } = await api('/api/auth/login', {
    method: 'POST',
    body: { email: demoUser.email, password: demoUser.password, guestCartId },
  })
  return sessionSchema.parse(json)
}
