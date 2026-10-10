import { HttpResponse, http } from 'msw'
import { calculateTotals, shippingMethods } from '@/lib/pricing'
import { createOrderRequestSchema, type Order, type OrderStatus } from '@/lib/schemas/order'
import { findUserCart, toCartResponse } from '../carts'
import { createId, db, persist, type StoredOrder } from '../db'
import {
  errorResponse,
  getSessionUserId,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from '../responses'

/** Card number that always declines, for testing the failure path. */
export const DECLINED_CARD_NUMBER = '4000000000000002'

const DAY_MS = 24 * 60 * 60 * 1000

// Orders progress on their own so order history has something to show
function statusFor(createdAt: string): OrderStatus {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  if (ageMs > 5 * DAY_MS) return 'delivered'
  if (ageMs > 2 * DAY_MS) return 'shipped'
  return 'placed'
}

function toOrderResponse({ userId, idempotencyKey, ...order }: StoredOrder): Order {
  return { ...order, status: statusFor(order.createdAt) }
}

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    const body = await readJson(request, createOrderRequestSchema)
    if (!body.success) return validationError(body.error)
    const { idempotencyKey, shippingAddress, shippingMethodId, payment } = body.data

    // A retried submit returns the original order instead of charging twice
    const previous = db().orders.find(
      (order) => order.userId === userId && order.idempotencyKey === idempotencyKey,
    )
    if (previous) return HttpResponse.json(toOrderResponse(previous))

    const storedCart = findUserCart(userId)
    const cart = storedCart ? toCartResponse(storedCart) : undefined
    if (!storedCart || !cart?.items.length) {
      return errorResponse(409, 'cart_empty', 'Your cart is empty')
    }

    const unavailableItems = cart.items
      .filter((item) => item.quantity > item.stock)
      .map((item) => ({ variantId: item.variantId, available: item.stock }))
    if (unavailableItems.length > 0) {
      return errorResponse(
        409,
        'insufficient_stock',
        'Some items in your cart are no longer available in the quantity you chose',
        { unavailableItems },
      )
    }

    if (payment.cardNumber === DECLINED_CARD_NUMBER) {
      return errorResponse(402, 'payment_declined', 'Your card was declined. Try another card.')
    }

    const shippingMethod = shippingMethods.find((method) => method.id === shippingMethodId)
    if (!shippingMethod) return notFound('Shipping method not found')

    const state = db()
    for (const item of cart.items) {
      state.stock[item.variantId] = item.stock - item.quantity
    }
    const order: StoredOrder = {
      id: createId('order'),
      number: `SF-${state.nextOrderNumber}`,
      userId,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      items: cart.items.map(({ id, stock, compareAtPriceCents, ...item }) => item),
      shippingAddress,
      shippingMethod,
      totals: calculateTotals(cart.items, shippingMethod),
      paymentLast4: payment.cardNumber.slice(-4),
    }
    state.nextOrderNumber += 1
    state.orders.push(order)
    storedCart.items = []
    persist()
    return HttpResponse.json(toOrderResponse(order), { status: 201 })
  }),

  http.get('/api/orders', ({ request }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    const orders = db()
      .orders.filter((order) => order.userId === userId)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toOrderResponse)
    return HttpResponse.json(orders)
  }),

  http.get<{ id: string }>('/api/orders/:id', ({ request, params }) => {
    const userId = getSessionUserId(request)
    if (!userId) return unauthorized()
    const order = db().orders.find((o) => o.id === params.id && o.userId === userId)
    return order ? HttpResponse.json(toOrderResponse(order)) : notFound('Order not found')
  }),
]
