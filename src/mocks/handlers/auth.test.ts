import { describe, expect, it } from 'vitest'
import { sessionSchema, userSchema } from '@/lib/schemas/auth'
import { cartSchema } from '@/lib/schemas/cart'
import { apiErrorSchema } from '@/lib/schemas/common'
import { catalog, demoUser } from '@/mocks/db'
import { api, signInAsDemoUser } from '@/test/api'

const [first, second] = catalog.products
  .flatMap((product) => product.variants)
  .filter((variant) => variant.stock >= 3)
if (!first || !second) throw new Error('Seed needs two variants with stock')

async function guestCartWith(variantId: string, quantity: number) {
  const cart = cartSchema.parse((await api('/api/cart')).json)
  await api('/api/cart/items', { method: 'POST', cartId: cart.id, body: { variantId, quantity } })
  return cart.id
}

describe('POST /api/auth/register', () => {
  const newUser = { email: 'Sam@Example.com', password: 'longenough', name: 'Sam Rivera' }

  it('creates the account and a session', async () => {
    const { status, json } = await api('/api/auth/register', { method: 'POST', body: newUser })
    const session = sessionSchema.parse(json)

    expect(status).toBe(201)
    expect(session.user).toMatchObject({ email: 'sam@example.com', name: 'Sam Rivera' })
  })

  it('rejects an email that is already registered, ignoring case', async () => {
    await api('/api/auth/register', { method: 'POST', body: newUser })

    const { status, json } = await api('/api/auth/register', {
      method: 'POST',
      body: { ...newUser, email: 'sam@EXAMPLE.com' },
    })

    expect(status).toBe(409)
    expect(apiErrorSchema.parse(json).error.fieldErrors).toHaveProperty('email')
  })

  it('rejects a short password', async () => {
    const { status, json } = await api('/api/auth/register', {
      method: 'POST',
      body: { ...newUser, password: 'short' },
    })

    expect(status).toBe(400)
    expect(apiErrorSchema.parse(json).error.fieldErrors).toHaveProperty('password')
  })

  it('lets the new account sign in', async () => {
    await api('/api/auth/register', { method: 'POST', body: newUser })

    const { status } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: newUser.email, password: newUser.password },
    })

    expect(status).toBe(200)
  })
})

describe('POST /api/auth/login', () => {
  it('signs in the demo user', async () => {
    const session = await signInAsDemoUser()

    expect(session.user.email).toBe(demoUser.email)
  })

  it('rejects a wrong password without saying which field was wrong', async () => {
    const { status, json } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: demoUser.email, password: 'wrong-password' },
    })
    const { error } = apiErrorSchema.parse(json)

    expect(status).toBe(401)
    expect(error.code).toBe('invalid_credentials')
    expect(error.fieldErrors).toBeUndefined()
  })

  it('moves guest cart items into the account cart', async () => {
    const guestCartId = await guestCartWith(first.id, 2)

    const { token } = await signInAsDemoUser(guestCartId)
    const cart = cartSchema.parse((await api('/api/cart', { token })).json)

    expect(cart.items).toMatchObject([{ variantId: first.id, quantity: 2 }])
  })

  it('adds guest quantities to lines already in the account cart, capped at stock', async () => {
    const { token } = await signInAsDemoUser()
    await api('/api/cart/items', {
      method: 'POST',
      token,
      body: { variantId: second.id, quantity: second.stock },
    })
    const guestCartId = await guestCartWith(second.id, 2)

    await signInAsDemoUser(guestCartId)
    const cart = cartSchema.parse((await api('/api/cart', { token })).json)

    expect(cart.items).toMatchObject([{ variantId: second.id, quantity: second.stock }])
  })

  it('discards the guest cart after merging', async () => {
    const guestCartId = await guestCartWith(first.id, 1)
    await signInAsDemoUser(guestCartId)

    const cart = cartSchema.parse((await api('/api/cart', { cartId: guestCartId })).json)

    expect(cart.id).not.toBe(guestCartId)
  })
})

describe('session lifecycle', () => {
  it('returns the user for a valid token', async () => {
    const { token } = await signInAsDemoUser()

    const { status, json } = await api('/api/auth/me', { token })

    expect(status).toBe(200)
    expect(userSchema.parse(json).email).toBe(demoUser.email)
  })

  it('returns 401 without a token', async () => {
    const { status } = await api('/api/auth/me')

    expect(status).toBe(401)
  })

  it('invalidates the token on logout', async () => {
    const { token } = await signInAsDemoUser()

    const logout = await api('/api/auth/logout', { method: 'POST', token })
    const me = await api('/api/auth/me', { token })

    expect(logout.status).toBe(204)
    expect(me.status).toBe(401)
  })
})
