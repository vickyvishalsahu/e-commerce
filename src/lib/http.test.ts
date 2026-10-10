import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiError, request } from '@/lib/http'
import { setGuestCartId } from '@/lib/session'
import { server } from '@/mocks/node'

describe('request', () => {
  it('returns the parsed response body', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })))

    const result = await request('/api/ping', { schema: z.object({ ok: z.boolean() }) })

    expect(result).toEqual({ ok: true })
  })

  it('throws ApiError with the code and field errors from the error body', async () => {
    server.use(
      http.post('/api/ping', () =>
        HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'Bad',
              fieldErrors: { email: ['Required'] },
            },
          },
          { status: 400 },
        ),
      ),
    )

    const error = await request('/api/ping', {
      schema: z.unknown(),
      method: 'POST',
      body: {},
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: 'validation_error',
      fieldErrors: { email: ['Required'] },
    })
  })

  it('falls back to a server_error when the error body is not JSON', async () => {
    server.use(http.get('/api/ping', () => new HttpResponse('Bad gateway', { status: 502 })))

    await expect(request('/api/ping', { schema: z.unknown() })).rejects.toMatchObject({
      status: 502,
      code: 'server_error',
    })
  })

  it('rejects a response that does not match the schema', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: 'yes' })))

    await expect(
      request('/api/ping', { schema: z.object({ ok: z.boolean() }) }),
    ).rejects.toBeInstanceOf(z.ZodError)
  })

  it('sends the guest cart id and a JSON body', async () => {
    setGuestCartId('cart_123')
    let received: { cartId: string | null; body: unknown } | undefined
    server.use(
      http.post('/api/ping', async ({ request: req }) => {
        received = { cartId: req.headers.get('X-Cart-Id'), body: await req.json() }
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await request('/api/ping', { schema: z.null(), method: 'POST', body: { quantity: 2 } })

    expect(received).toEqual({ cartId: 'cart_123', body: { quantity: 2 } })
  })
})
