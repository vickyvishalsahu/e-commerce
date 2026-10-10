import { describe, expect, it } from 'vitest'
import { cartSchema } from '@/lib/schemas/cart'
import { apiErrorSchema } from '@/lib/schemas/common'
import { catalog } from '@/mocks/db'
import { api, signInAsDemoUser } from '@/test/api'

function findVariant(predicate: (stock: number) => boolean) {
  const variant = catalog.products.flatMap((p) => p.variants).find((v) => predicate(v.stock))
  if (!variant) throw new Error('No matching variant in seed')
  return variant
}

const inStock = findVariant((stock) => stock >= 5)
const soldOut = findVariant((stock) => stock === 0)

async function newGuestCart() {
  const { json } = await api('/api/cart')
  return cartSchema.parse(json)
}

async function addItem(cartId: string, variantId: string, quantity = 1) {
  return api('/api/cart/items', { method: 'POST', cartId, body: { variantId, quantity } })
}

async function cartWithOneItem() {
  const { id } = await newGuestCart()
  const { json } = await addItem(id, inStock.id, 1)
  const item = cartSchema.parse(json).items[0]
  if (!item) throw new Error('Expected a cart item')
  return { cartId: id, itemId: item.id }
}

describe('guest cart', () => {
  it('creates an empty cart on first request', async () => {
    const cart = await newGuestCart()

    expect(cart.id).toMatch(/^cart_/)
    expect(cart.items).toEqual([])
  })

  it('returns the same cart for the same X-Cart-Id', async () => {
    const cart = await newGuestCart()
    await addItem(cart.id, inStock.id)

    const { json } = await api('/api/cart', { cartId: cart.id })

    expect(cartSchema.parse(json).items).toHaveLength(1)
  })

  it('creates a new cart when the X-Cart-Id is unknown', async () => {
    const { json } = await api('/api/cart', { cartId: 'cart_missing' })

    expect(cartSchema.parse(json).id).not.toBe('cart_missing')
  })
})

describe('POST /api/cart/items', () => {
  it('adds a line with live price and stock', async () => {
    const { id } = await newGuestCart()

    const { status, json } = await addItem(id, inStock.id, 2)
    const [item] = cartSchema.parse(json).items

    expect(status).toBe(200)
    expect(item).toMatchObject({
      variantId: inStock.id,
      quantity: 2,
      unitPriceCents: inStock.priceCents,
      stock: inStock.stock,
    })
  })

  it('increases the quantity when the variant is already in the cart', async () => {
    const { id } = await newGuestCart()
    await addItem(id, inStock.id, 1)

    const { json } = await addItem(id, inStock.id, 2)
    const cart = cartSchema.parse(json)

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]?.quantity).toBe(3)
  })

  it('rejects quantities above available stock with 409', async () => {
    const { id } = await newGuestCart()

    const { status, json } = await addItem(id, inStock.id, inStock.stock + 1)
    const { error } = apiErrorSchema.parse(json)

    expect(status).toBe(409)
    expect(error.code).toBe('insufficient_stock')
    expect(error.unavailableItems).toEqual([{ variantId: inStock.id, available: inStock.stock }])
  })

  it('counts what is already in the cart against stock', async () => {
    const { id } = await newGuestCart()
    await addItem(id, inStock.id, inStock.stock)

    const { status } = await addItem(id, inStock.id, 1)

    expect(status).toBe(409)
  })

  it('rejects sold-out variants', async () => {
    const { id } = await newGuestCart()

    const { status, json } = await addItem(id, soldOut.id)

    expect(status).toBe(409)
    expect(apiErrorSchema.parse(json).error.message).toBe('This item is out of stock')
  })

  it('returns 404 for an unknown variant', async () => {
    const { id } = await newGuestCart()

    const { status } = await addItem(id, 'variant_missing')

    expect(status).toBe(404)
  })

  it('rejects a zero quantity', async () => {
    const { id } = await newGuestCart()

    const { status } = await addItem(id, inStock.id, 0)

    expect(status).toBe(400)
  })
})

describe('PATCH and DELETE /api/cart/items/:itemId', () => {
  it('sets the quantity', async () => {
    const { cartId, itemId } = await cartWithOneItem()

    const { json } = await api(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      cartId,
      body: { quantity: 4 },
    })

    expect(cartSchema.parse(json).items[0]?.quantity).toBe(4)
  })

  it('rejects a quantity above stock', async () => {
    const { cartId, itemId } = await cartWithOneItem()

    const { status } = await api(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      cartId,
      body: { quantity: inStock.stock + 1 },
    })

    expect(status).toBe(409)
  })

  it('removes the line', async () => {
    const { cartId, itemId } = await cartWithOneItem()

    const { json } = await api(`/api/cart/items/${itemId}`, { method: 'DELETE', cartId })

    expect(cartSchema.parse(json).items).toEqual([])
  })

  it('returns 404 when the line is not in this cart', async () => {
    const { itemId } = await cartWithOneItem()
    const otherCart = await newGuestCart()

    const { status } = await api(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      cartId: otherCart.id,
    })

    expect(status).toBe(404)
  })
})

describe('signed-in cart', () => {
  it('ignores X-Cart-Id and uses the account cart', async () => {
    const guest = await newGuestCart()
    await addItem(guest.id, inStock.id)
    const { token } = await signInAsDemoUser()

    const { json } = await api('/api/cart', { token, cartId: guest.id })
    const cart = cartSchema.parse(json)

    expect(cart.id).not.toBe(guest.id)
    expect(cart.items).toEqual([])
  })
})
