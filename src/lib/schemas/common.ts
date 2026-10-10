import { z } from 'zod'

export const centsSchema = z.int().nonnegative()

export const apiErrorCodeSchema = z.enum([
  'validation_error',
  'not_found',
  'unauthorized',
  'email_taken',
  'invalid_credentials',
  'insufficient_stock',
  'cart_empty',
  'payment_declined',
  'server_error',
])

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    unavailableItems: z
      .array(z.object({ variantId: z.string(), available: z.int().nonnegative() }))
      .optional(),
  }),
})

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type ApiError = z.infer<typeof apiErrorSchema>

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.int().min(1),
    pageSize: z.int().min(1),
    total: z.int().nonnegative(),
    totalPages: z.int().nonnegative(),
  })
}
