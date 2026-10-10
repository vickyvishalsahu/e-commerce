import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/http'
import { cartSchema, type AddCartItemRequest } from '@/lib/schemas/cart'
import { setGuestCartId } from '@/lib/session'

export const cartKeys = {
  all: ['cart'] as const,
}

export function cartQueryOptions() {
  return queryOptions({
    queryKey: cartKeys.all,
    queryFn: async () => {
      const cart = await request('/api/cart', { schema: cartSchema })
      // The API creates a guest cart on first request; remember it for later requests
      setGuestCartId(cart.id)
      return cart
    },
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: AddCartItemRequest) =>
      request('/api/cart/items', { method: 'POST', body: item, schema: cartSchema }),
    onSuccess: (cart) => {
      setGuestCartId(cart.id)
      queryClient.setQueryData(cartKeys.all, cart)
    },
  })
}
