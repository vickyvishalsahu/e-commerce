const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  trailingZeroDisplay: 'stripIfInteger',
})

/** Formats integer cents for display: 8900 -> "$89", 12232 -> "$122.32". */
export function formatPrice(cents: number) {
  return priceFormatter.format(cents / 100)
}
