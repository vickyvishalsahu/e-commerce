import { describe, expect, it } from 'vitest'
import { formatPrice } from '@/lib/format'

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
