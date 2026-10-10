import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
})

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  guestCartId: z.string().optional(),
})

export const registerRequestSchema = loginRequestSchema.extend({
  name: z.string().trim().min(1),
})

export const sessionSchema = z.object({
  token: z.string(),
  user: userSchema,
})

export type User = z.infer<typeof userSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type Session = z.infer<typeof sessionSchema>
