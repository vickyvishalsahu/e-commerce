import { z } from 'zod'
import { addressInputSchema } from './account'
import { centsSchema } from './common'

export const shippingMethodIdSchema = z.enum(['standard', 'express', 'next-day'])

export const shippingMethodSchema = z.object({
  id: shippingMethodIdSchema,
  name: z.string(),
  description: z.string(),
  priceCents: centsSchema,
  freeOverCents: centsSchema.nullable(),
})

function passesLuhn(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

function isFutureExpiry(expiry: string) {
  const [month, year] = expiry.split('/').map(Number)
  if (month === undefined || year === undefined) return false
  // Cards stay valid through the last day of their expiry month
  const firstDayAfterExpiry = new Date(2000 + year, month, 1)
  return firstDayAfterExpiry > new Date()
}

export const paymentInputSchema = z.object({
  nameOnCard: z.string().trim().min(1),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, 'Enter a card number of 13 to 19 digits')
    .refine(passesLuhn, 'Card number is not valid'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY')
    .refine(isFutureExpiry, 'Card has expired'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Enter the 3 or 4 digit code'),
})

export const createOrderRequestSchema = z.object({
  idempotencyKey: z.uuid(),
  shippingAddress: addressInputSchema,
  shippingMethodId: shippingMethodIdSchema,
  payment: paymentInputSchema,
})

export const orderTotalsSchema = z.object({
  subtotalCents: centsSchema,
  shippingCents: centsSchema,
  taxCents: centsSchema,
  totalCents: centsSchema,
})

export const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.url(),
  variantLabel: z.string(),
  unitPriceCents: centsSchema,
  quantity: z.int().min(1),
})

export const orderStatusSchema = z.enum(['placed', 'shipped', 'delivered'])

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: orderStatusSchema,
  createdAt: z.iso.datetime(),
  items: z.array(orderItemSchema).min(1),
  shippingAddress: addressInputSchema,
  shippingMethod: shippingMethodSchema,
  totals: orderTotalsSchema,
  paymentLast4: z.string().regex(/^\d{4}$/),
})

export type ShippingMethodId = z.infer<typeof shippingMethodIdSchema>
export type ShippingMethod = z.infer<typeof shippingMethodSchema>
export type PaymentInput = z.infer<typeof paymentInputSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type OrderTotals = z.infer<typeof orderTotalsSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type Order = z.infer<typeof orderSchema>
