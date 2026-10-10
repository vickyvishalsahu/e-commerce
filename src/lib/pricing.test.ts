import { describe, expect, it } from 'vitest'
import { calculateTotals, shippingMethods } from '@/lib/pricing'

const [standard, express] = shippingMethods

describe('calculateTotals', () => {
  it('matches the checkout wireframe example', () => {
    const totals = calculateTotals([
      { unitPriceCents: 8900, quantity: 1 },
      { unitPriceCents: 2400, quantity: 1 },
    ])

    expect(totals).toEqual({
      subtotalCents: 11300,
      shippingCents: 0,
      taxCents: 932,
      totalCents: 12232,
    })
  })

  it('charges standard shipping below the free threshold', () => {
    const totals = calculateTotals([{ unitPriceCents: 7499, quantity: 1 }], standard)

    expect(totals.shippingCents).toBe(599)
  })

  it('makes standard shipping free at exactly the threshold', () => {
    const totals = calculateTotals([{ unitPriceCents: 2500, quantity: 3 }], standard)

    expect(totals.subtotalCents).toBe(7500)
    expect(totals.shippingCents).toBe(0)
  })

  it('always charges for express shipping', () => {
    const totals = calculateTotals([{ unitPriceCents: 50000, quantity: 1 }], express)

    expect(totals.shippingCents).toBe(1200)
  })

  it('charges nothing for an empty cart', () => {
    expect(calculateTotals([], express)).toEqual({
      subtotalCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
    })
  })

  it('rounds tax half up to the cent', () => {
    // 200 * 8.25% = 16.5 cents
    expect(calculateTotals([{ unitPriceCents: 200, quantity: 1 }]).taxCents).toBe(17)
  })
})
