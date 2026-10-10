import type { OrderTotals, ShippingMethod } from '@/lib/schemas/order'

const TAX_RATE_BASIS_POINTS = 825

export const shippingMethods = [
  {
    id: 'standard',
    name: 'Standard',
    description: '5-7 business days',
    priceCents: 599,
    freeOverCents: 7500,
  },
  {
    id: 'express',
    name: 'Express',
    description: '2 business days',
    priceCents: 1200,
    freeOverCents: null,
  },
  {
    id: 'next-day',
    name: 'Next day',
    description: 'Order by 2pm for next-day delivery',
    priceCents: 2400,
    freeOverCents: null,
  },
] as const satisfies readonly ShippingMethod[]

export const defaultShippingMethod: ShippingMethod = shippingMethods[0]

interface PricedLine {
  unitPriceCents: number
  quantity: number
}

export function calculateTotals(
  lines: readonly PricedLine[],
  shippingMethod: ShippingMethod = defaultShippingMethod,
): OrderTotals {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const qualifiesForFreeShipping =
    shippingMethod.freeOverCents !== null && subtotalCents >= shippingMethod.freeOverCents
  const shippingCents =
    subtotalCents === 0 || qualifiesForFreeShipping ? 0 : shippingMethod.priceCents
  // Tax applies to merchandise only, rounded half up to the cent
  const taxCents = Math.round((subtotalCents * TAX_RATE_BASIS_POINTS) / 10_000)

  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  }
}
