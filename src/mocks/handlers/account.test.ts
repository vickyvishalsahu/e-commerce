import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { addressSchema, wishlistSchema } from '@/lib/schemas/account'
import { shippingMethodSchema } from '@/lib/schemas/order'
import { catalog } from '@/mocks/db'
import { api, signInAsDemoUser } from '@/test/api'

const address = {
  fullName: 'Priya Shah',
  line1: '418 Alder St',
  line2: '',
  city: 'Portland',
  state: 'OR',
  postalCode: '97205',
  country: 'US',
  phone: '5035550142',
}

const [productA, productB] = catalog.products
if (!productA || !productB) throw new Error('Seed needs products')

describe('GET /api/shipping-methods', () => {
  it('lists the three shipping methods', async () => {
    const { json } = await api('/api/shipping-methods')

    expect(
      z
        .array(shippingMethodSchema)
        .parse(json)
        .map((m) => m.id),
    ).toEqual(['standard', 'express', 'next-day'])
  })
})

describe('addresses', () => {
  it('requires sign-in', async () => {
    expect((await api('/api/addresses')).status).toBe(401)
  })

  it('saves, lists and deletes an address', async () => {
    const { token } = await signInAsDemoUser()

    const created = await api('/api/addresses', { method: 'POST', token, body: address })
    const saved = addressSchema.parse(created.json)
    const listed = z.array(addressSchema).parse((await api('/api/addresses', { token })).json)
    const deleted = await api(`/api/addresses/${saved.id}`, { method: 'DELETE', token })
    const after = z.array(addressSchema).parse((await api('/api/addresses', { token })).json)

    expect(created.status).toBe(201)
    expect(listed).toEqual([saved])
    expect(deleted.status).toBe(204)
    expect(after).toEqual([])
  })

  it('rejects an invalid ZIP code', async () => {
    const { token } = await signInAsDemoUser()

    const { status } = await api('/api/addresses', {
      method: 'POST',
      token,
      body: { ...address, postalCode: '972' },
    })

    expect(status).toBe(400)
  })
})

describe('wishlist', () => {
  it('requires sign-in', async () => {
    expect((await api('/api/wishlist')).status).toBe(401)
  })

  it('adds products newest first and ignores duplicates', async () => {
    const { token } = await signInAsDemoUser()

    await api(`/api/wishlist/${productA.id}`, { method: 'PUT', token })
    await api(`/api/wishlist/${productB.id}`, { method: 'PUT', token })
    const { json } = await api(`/api/wishlist/${productA.id}`, { method: 'PUT', token })

    expect(wishlistSchema.parse(json).items.map((p) => p.id)).toEqual([productB.id, productA.id])
  })

  it('removes a product', async () => {
    const { token } = await signInAsDemoUser()
    await api(`/api/wishlist/${productA.id}`, { method: 'PUT', token })

    const { json } = await api(`/api/wishlist/${productA.id}`, { method: 'DELETE', token })

    expect(wishlistSchema.parse(json).items).toEqual([])
  })

  it('returns 404 for an unknown product', async () => {
    const { token } = await signInAsDemoUser()

    const { status } = await api('/api/wishlist/prod_missing', { method: 'PUT', token })

    expect(status).toBe(404)
  })
})
