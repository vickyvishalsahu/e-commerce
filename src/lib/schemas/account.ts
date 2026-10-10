import { z } from 'zod'
import { productSummarySchema } from './catalog'

export const addressInputSchema = z.object({
  fullName: z.string().trim().min(1),
  line1: z.string().trim().min(1),
  line2: z.string().trim(),
  city: z.string().trim().min(1),
  state: z.string().regex(/^[A-Z]{2}$/, 'Use the two-letter state code'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Use a 5-digit ZIP code'),
  country: z.literal('US'),
  phone: z.string().regex(/^\d{10}$/, 'Use a 10-digit phone number'),
})

export const addressSchema = addressInputSchema.extend({
  id: z.string(),
})

export const wishlistSchema = z.object({
  items: z.array(productSummarySchema),
})

export type AddressInput = z.infer<typeof addressInputSchema>
export type Address = z.infer<typeof addressSchema>
export type Wishlist = z.infer<typeof wishlistSchema>
