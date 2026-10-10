import { queryOptions } from '@tanstack/react-query'
import { request } from '@/lib/http'
import { cartSchema } from '@/lib/schemas/cart'
import { setGuestCartId } from '@/lib/session'

export const cartKeys = {
  all: ['cart'] as const,
}

export function cartQueryOptions() {
  return queryOptions({
    queryKey: cartKeys.all,
    queryFn: async ({ signal }) => {
      const cart = await request('/api/cart', { schema: cartSchema, signal })
      // The API creates a guest cart on first request; remember it for later requests
      setGuestCartId(cart.id)
      return cart
    },
  })
}
