import { HttpResponse, http } from 'msw'
import {
  addCartItemRequestSchema,
  MAX_LINE_QUANTITY,
  updateCartItemRequestSchema,
} from '@/lib/schemas/cart'
import { resolveCart, toCartResponse } from '../carts'
import { findVariant } from '../catalog'
import { createId, persist } from '../db'
import { errorResponse, notFound, readJson, validationError } from '../responses'

function insufficientStock(variantId: string, available: number) {
  const message = available === 0 ? 'This item is out of stock' : `Only ${available} left in stock`
  return errorResponse(409, 'insufficient_stock', message, {
    unavailableItems: [{ variantId, available }],
  })
}

export const cartHandlers = [
  http.get('/api/cart', ({ request }) => HttpResponse.json(toCartResponse(resolveCart(request)))),

  http.post('/api/cart/items', async ({ request }) => {
    const body = await readJson(request, addCartItemRequestSchema)
    if (!body.success) return validationError(body.error)
    const { variantId, quantity } = body.data

    const match = findVariant(variantId)
    if (!match) return notFound('Product variant not found')

    const cart = resolveCart(request)
    const existing = cart.items.find((item) => item.variantId === variantId)
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    if (nextQuantity > MAX_LINE_QUANTITY) {
      const message = `You can add up to ${MAX_LINE_QUANTITY} of an item`
      return errorResponse(400, 'validation_error', message, {
        fieldErrors: { quantity: [message] },
      })
    }
    if (nextQuantity > match.variant.stock) return insufficientStock(variantId, match.variant.stock)

    if (existing) existing.quantity = nextQuantity
    else cart.items.push({ id: createId('item'), variantId, quantity })
    persist()
    return HttpResponse.json(toCartResponse(cart))
  }),

  http.patch<{ itemId: string }>('/api/cart/items/:itemId', async ({ request, params }) => {
    const body = await readJson(request, updateCartItemRequestSchema)
    if (!body.success) return validationError(body.error)

    const cart = resolveCart(request)
    const item = cart.items.find((line) => line.id === params.itemId)
    if (!item) return notFound('Cart item not found')

    const stock = findVariant(item.variantId)?.variant.stock ?? 0
    if (body.data.quantity > stock) return insufficientStock(item.variantId, stock)

    item.quantity = body.data.quantity
    persist()
    return HttpResponse.json(toCartResponse(cart))
  }),

  http.delete<{ itemId: string }>('/api/cart/items/:itemId', ({ request, params }) => {
    const cart = resolveCart(request)
    const index = cart.items.findIndex((line) => line.id === params.itemId)
    if (index === -1) return notFound('Cart item not found')

    cart.items.splice(index, 1)
    persist()
    return HttpResponse.json(toCartResponse(cart))
  }),
]
