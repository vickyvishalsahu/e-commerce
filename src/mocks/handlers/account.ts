import { HttpResponse, http } from 'msw'
import { addressInputSchema, type Address, type Wishlist } from '@/lib/schemas/account'
import { shippingMethods } from '@/lib/pricing'
import { findProductById, toSummary } from '../catalog'
import { createId, db, persist } from '../db'
import { getSessionUserId, notFound, readJson, unauthorized, validationError } from '../responses'

function toWishlist(userId: string): Wishlist {
  const productIds = db().wishlists[userId] ?? []
  return {
    items: productIds
      .map(findProductById)
      .filter((product) => product !== undefined)
      .map(toSummary),
  }
}

export const accountHandlers = [
  http.get('/api/shipping-methods', () => HttpResponse.json(shippingMethods)),

  http.get('/api/addresses', ({ request }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    const addresses: Address[] = db()
      .addresses.filter((address) => address.userId === userId)
      .map(({ userId: ownerId, ...address }) => address)
    return HttpResponse.json(addresses)
  }),

  http.post('/api/addresses', async ({ request }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    const body = await readJson(request, addressInputSchema)
    if (!body.success) return validationError(body.error)

    const address: Address = { id: createId('addr'), ...body.data }
    db().addresses.push({ ...address, userId })
    persist()
    return HttpResponse.json(address, { status: 201 })
  }),

  http.delete<{ id: string }>('/api/addresses/:id', ({ request, params }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    const { addresses } = db()
    const index = addresses.findIndex((a) => a.id === params.id && a.userId === userId)
    if (index === -1) return notFound('Address not found')

    addresses.splice(index, 1)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/wishlist', ({ request }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    return HttpResponse.json(toWishlist(userId))
  }),

  http.put<{ productId: string }>('/api/wishlist/:productId', ({ request, params }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    if (!findProductById(params.productId)) return notFound('Product not found')

    const { wishlists } = db()
    const current = wishlists[userId] ?? []
    if (!current.includes(params.productId)) wishlists[userId] = [params.productId, ...current]
    persist()
    return HttpResponse.json(toWishlist(userId))
  }),

  http.delete<{ productId: string }>('/api/wishlist/:productId', ({ request, params }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()

    const { wishlists } = db()
    wishlists[userId] = (wishlists[userId] ?? []).filter((id) => id !== params.productId)
    persist()
    return HttpResponse.json(toWishlist(userId))
  }),
]
