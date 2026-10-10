import { z } from 'zod'
import { centsSchema } from './common'

export const cartQuantitySchema = z.int().min(1).max(99)

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.url(),
  variantLabel: z.string(),
  unitPriceCents: centsSchema,
  compareAtPriceCents: centsSchema.nullable(),
  quantity: cartQuantitySchema,
  stock: z.int().nonnegative(),
})

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
})

export const addCartItemRequestSchema = z.object({
  variantId: z.string().min(1),
  quantity: cartQuantitySchema.default(1),
})

export const updateCartItemRequestSchema = z.object({
  quantity: cartQuantitySchema,
})

export type CartItem = z.infer<typeof cartItemSchema>
export type Cart = z.infer<typeof cartSchema>
export type AddCartItemRequest = z.input<typeof addCartItemRequestSchema>
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>
