import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { sessionSchema } from '@/lib/schemas/auth'
import { productSchema } from '@/lib/schemas/catalog'
import { cartSchema } from '@/lib/schemas/cart'
import { apiErrorSchema } from '@/lib/schemas/common'
import { orderSchema } from '@/lib/schemas/order'
import { catalog } from '@/mocks/db'
import { api, signInAsDemoUser } from '@/test/api'
import { DECLINED_CARD_NUMBER } from './orders'

const product = catalog.products.find((p) => p.variants.some((v) => v.stock >= 3))
const variant = product?.variants.find((v) => v.stock >= 3)
if (!product || !variant) throw new Error('Seed needs a variant with stock')

function orderRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: crypto.randomUUID(),
    shippingAddress: {
      fullName: 'Priya Shah',
      line1: '418 Alder St',
      line2: '',
      city: 'Portland',
      state: 'OR',
      postalCode: '97205',
      country: 'US',
      phone: '5035550142',
    },
    shippingMethodId: 'express',
    payment: {
      nameOnCard: 'Priya Shah',
      cardNumber: '4242424242424242',
      expiry: '12/30',
      cvc: '123',
    },
    ...overrides,
  }
}

async function signedInWithCart(quantity = 2) {
  const { token } = await signInAsDemoUser()
  await api('/api/cart/items', {
    method: 'POST',
    token,
    body: { variantId: variant?.id, quantity },
  })
  return token
}

async function registerOtherShopper() {
  const { json } = await api('/api/auth/register', {
    method: 'POST',
    body: { email: 'other@example.com', password: 'longenough', name: 'Other Shopper' },
  })
  return sessionSchema.parse(json).token
}

async function liveStock() {
  const { json } = await api(`/api/products/${product?.slug}`)
  return productSchema.parse(json).variants.find((v) => v.id === variant?.id)?.stock
}

describe('POST /api/orders', () => {
  it('requires sign-in', async () => {
    const { status } = await api('/api/orders', { method: 'POST', body: orderRequest() })

    expect(status).toBe(401)
  })

  it('places the order with server-computed totals', async () => {
    const token = await signedInWithCart(2)

    const { status, json } = await api('/api/orders', {
      method: 'POST',
      token,
      body: orderRequest(),
    })
    const order = orderSchema.parse(json)
    const subtotalCents = variant.priceCents * 2

    expect(status).toBe(201)
    expect(order.number).toBe('SF-100001')
    expect(order.status).toBe('placed')
    expect(order.paymentLast4).toBe('4242')
    expect(order.totals).toEqual({
      subtotalCents,
      shippingCents: 1200,
      taxCents: Math.round((subtotalCents * 825) / 10_000),
      totalCents: subtotalCents + 1200 + Math.round((subtotalCents * 825) / 10_000),
    })
  })

  it('decrements stock and empties the cart', async () => {
    const token = await signedInWithCart(2)
    const stockBefore = await liveStock()

    await api('/api/orders', { method: 'POST', token, body: orderRequest() })
    const cart = cartSchema.parse((await api('/api/cart', { token })).json)

    expect(await liveStock()).toBe((stockBefore ?? 0) - 2)
    expect(cart.items).toEqual([])
  })

  it('returns the original order when the same idempotency key is retried', async () => {
    const token = await signedInWithCart(1)
    const request = orderRequest()

    const first = await api('/api/orders', { method: 'POST', token, body: request })
    const retry = await api('/api/orders', { method: 'POST', token, body: request })
    const orders = z.array(orderSchema).parse((await api('/api/orders', { token })).json)

    expect(retry.status).toBe(200)
    expect(orderSchema.parse(retry.json).id).toBe(orderSchema.parse(first.json).id)
    expect(orders).toHaveLength(1)
  })

  it('rejects an empty cart', async () => {
    const { token } = await signInAsDemoUser()

    const { status, json } = await api('/api/orders', {
      method: 'POST',
      token,
      body: orderRequest(),
    })

    expect(status).toBe(409)
    expect(apiErrorSchema.parse(json).error.code).toBe('cart_empty')
  })

  it('rechecks stock at checkout', async () => {
    const token = await signedInWithCart(variant.stock)
    const otherShopper = await registerOtherShopper()
    await api('/api/cart/items', {
      method: 'POST',
      token: otherShopper,
      body: { variantId: variant.id, quantity: 1 },
    })
    await api('/api/orders', { method: 'POST', token: otherShopper, body: orderRequest() })

    const { status, json } = await api('/api/orders', {
      method: 'POST',
      token,
      body: orderRequest(),
    })
    const { error } = apiErrorSchema.parse(json)

    expect(status).toBe(409)
    expect(error.code).toBe('insufficient_stock')
    expect(error.unavailableItems).toEqual([
      { variantId: variant.id, available: variant.stock - 1 },
    ])
  })

  it('declines the test decline card without touching stock or cart', async () => {
    const token = await signedInWithCart(1)
    const stockBefore = await liveStock()

    const { status, json } = await api('/api/orders', {
      method: 'POST',
      token,
      body: orderRequest({
        payment: {
          nameOnCard: 'Priya Shah',
          cardNumber: DECLINED_CARD_NUMBER,
          expiry: '12/30',
          cvc: '123',
        },
      }),
    })
    const cart = cartSchema.parse((await api('/api/cart', { token })).json)

    expect(status).toBe(402)
    expect(apiErrorSchema.parse(json).error.code).toBe('payment_declined')
    expect(await liveStock()).toBe(stockBefore)
    expect(cart.items).toHaveLength(1)
  })

  it('reports nested validation errors by field path', async () => {
    const token = await signedInWithCart(1)

    const { status, json } = await api('/api/orders', {
      method: 'POST',
      token,
      body: orderRequest({
        payment: { nameOnCard: '', cardNumber: '1234', expiry: '13/30', cvc: '1' },
      }),
    })
    const fields = Object.keys(apiErrorSchema.parse(json).error.fieldErrors ?? {})

    expect(status).toBe(400)
    expect(fields).toEqual(
      expect.arrayContaining([
        'payment.nameOnCard',
        'payment.cardNumber',
        'payment.expiry',
        'payment.cvc',
      ]),
    )
  })
})

describe('GET /api/orders', () => {
  it("only returns the signed-in user's orders", async () => {
    const token = await signedInWithCart(1)
    const placed = orderSchema.parse(
      (await api('/api/orders', { method: 'POST', token, body: orderRequest() })).json,
    )
    const otherShopper = await registerOtherShopper()

    const mine = await api(`/api/orders/${placed.id}`, { token })
    const theirs = await api(`/api/orders/${placed.id}`, { token: otherShopper })
    const theirList = z
      .array(orderSchema)
      .parse((await api('/api/orders', { token: otherShopper })).json)

    expect(mine.status).toBe(200)
    expect(theirs.status).toBe(404)
    expect(theirList).toEqual([])
  })
})
