import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paymentInputSchema } from '@/lib/schemas/order'

const validPayment = {
  nameOnCard: 'Priya Shah',
  cardNumber: '4242424242424242',
  expiry: '12/27',
  cvc: '123',
}

describe('paymentInputSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts a valid card', () => {
    expect(paymentInputSchema.safeParse(validPayment).success).toBe(true)
  })

  it('rejects a number that fails the Luhn check', () => {
    const result = paymentInputSchema.safeParse({ ...validPayment, cardNumber: '4242424242424241' })

    expect(result.success).toBe(false)
  })

  it('accepts a card expiring this month', () => {
    expect(paymentInputSchema.safeParse({ ...validPayment, expiry: '10/26' }).success).toBe(true)
  })

  it('rejects a card that expired last month', () => {
    expect(paymentInputSchema.safeParse({ ...validPayment, expiry: '09/26' }).success).toBe(false)
  })
})
