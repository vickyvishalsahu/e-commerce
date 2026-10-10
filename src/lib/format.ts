const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  trailingZeroDisplay: 'stripIfInteger',
})

/** Formats integer cents for display: 8900 -> "$89", 12232 -> "$122.32". */
export function formatPrice(cents: number) {
  return priceFormatter.format(cents / 100)
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

/** Formats an ISO timestamp as a calendar date: "2026-03-04T10:00:00Z" -> "Mar 4, 2026". */
export function formatDate(isoTimestamp: string) {
  return dateFormatter.format(new Date(isoTimestamp))
}
