import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice } from '@/lib/format'

describe('formatPrice', () => {
  it('drops cents for whole-dollar amounts', () => {
    expect(formatPrice(8900)).toBe('$89')
  })

  it('shows cents when there are any', () => {
    expect(formatPrice(12232)).toBe('$122.32')
    expect(formatPrice(599)).toBe('$5.99')
  })

  it('groups thousands', () => {
    expect(formatPrice(140000)).toBe('$1,400')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0')
  })
})

describe('formatDate', () => {
  it('formats the calendar date in UTC', () => {
    expect(formatDate('2026-03-04T10:00:00.000Z')).toBe('Mar 4, 2026')
    expect(formatDate('2026-03-04T23:30:00.000Z')).toBe('Mar 4, 2026')
  })
})
