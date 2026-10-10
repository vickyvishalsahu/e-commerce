import { describe, expect, it } from 'vitest'
import type { Product, Variant } from '@/lib/schemas/catalog'
import {
  findSelectedVariant,
  isColorAvailable,
  parseVariantSelection,
  selectionImages,
  selectionPrice,
  sizeStock,
  updateVariantParams,
  variantLabel,
} from './variant-selection'

function variant(color: string | null, size: string | null, priceCents: number, stock: number) {
  return {
    id: `v-${color}-${size}`,
    sku: `SKU-${color}-${size}`,
    color,
    size,
    priceCents,
    compareAtPriceCents: null,
    stock,
  } satisfies Variant
}

function image(color: string | null, view: number) {
  return { url: `https://example.com/${color}-${view}.jpg`, alt: `${color} ${view}`, color }
}

const lamp: Product = {
  id: 'p1',
  slug: 'lamp',
  name: 'Lamp',
  description: '',
  details: [],
  categoryId: 'c1',
  categorySlug: 'lighting',
  colors: [
    { name: 'Brass', hex: '#b08d57' },
    { name: 'Black', hex: '#111111' },
  ],
  sizes: ['Small', 'Large'],
  images: [image('Brass', 1), image('Brass', 2), image('Black', 1)],
  variants: [
    variant('Brass', 'Small', 4000, 0),
    variant('Brass', 'Large', 6000, 0),
    variant('Black', 'Small', 4000, 3),
    variant('Black', 'Large', 6000, 12),
  ],
  rating: { average: 4, count: 2 },
  featured: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mug: Product = {
  ...lamp,
  id: 'p2',
  slug: 'mug',
  colors: [{ name: 'Sage', hex: '#9caf88' }],
  sizes: [],
  images: [image('Sage', 1)],
  variants: [variant('Sage', null, 1800, 4)],
}

const params = (init: Record<string, string>) => new URLSearchParams(init)

describe('parseVariantSelection', () => {
  it('reads color and size the product offers', () => {
    expect(parseVariantSelection(params({ color: 'Brass', size: 'Large' }), lamp)).toEqual({
      color: 'Brass',
      size: 'Large',
    })
  })

  it('defaults to the first color in stock and leaves size unchosen', () => {
    expect(parseVariantSelection(params({}), lamp)).toEqual({ color: 'Black', size: null })
  })

  it('drops values the product does not offer', () => {
    expect(parseVariantSelection(params({ color: 'Pink', size: 'Huge' }), lamp)).toEqual({
      color: 'Black',
      size: null,
    })
  })

  it('falls back to the first color when everything is sold out', () => {
    const soldOut = { ...lamp, variants: lamp.variants.map((v) => ({ ...v, stock: 0 })) }
    expect(parseVariantSelection(params({}), soldOut).color).toBe('Brass')
  })

  it('selects the only size when there is one', () => {
    const oneSize = { ...lamp, sizes: ['Large'] }
    expect(parseVariantSelection(params({}), oneSize).size).toBe('Large')
  })

  it('has no size for products without sizes', () => {
    expect(parseVariantSelection(params({ size: 'Large' }), mug)).toEqual({
      color: 'Sage',
      size: null,
    })
  })
})

describe('findSelectedVariant', () => {
  it('finds the variant for a full selection', () => {
    expect(findSelectedVariant(lamp, { color: 'Black', size: 'Large' })?.stock).toBe(12)
  })

  it('returns undefined until a size is chosen', () => {
    expect(findSelectedVariant(lamp, { color: 'Black', size: null })).toBeUndefined()
  })

  it('finds the variant of a color-only product', () => {
    expect(findSelectedVariant(mug, { color: 'Sage', size: null })?.priceCents).toBe(1800)
  })
})

describe('stock helpers', () => {
  it('knows which colors have stock', () => {
    expect(isColorAvailable(lamp, 'Brass')).toBe(false)
    expect(isColorAvailable(lamp, 'Black')).toBe(true)
  })

  it('reports stock per size within a color', () => {
    expect(sizeStock(lamp, 'Black', 'Small')).toBe(3)
    expect(sizeStock(lamp, 'Brass', 'Small')).toBe(0)
  })
})

describe('selectionPrice', () => {
  it('uses the chosen variant price', () => {
    expect(selectionPrice(lamp, { color: 'Black', size: 'Large' })).toEqual({
      priceCents: 6000,
      compareAtPriceCents: null,
      fromPrice: false,
    })
  })

  it('shows a from price before a size is chosen', () => {
    expect(selectionPrice(lamp, { color: 'Black', size: null })).toEqual({
      priceCents: 4000,
      compareAtPriceCents: null,
      fromPrice: true,
    })
  })
})

describe('selectionImages', () => {
  it('shows the images for the selected color', () => {
    expect(selectionImages(lamp, 'Brass').map((img) => img.alt)).toEqual(['Brass 1', 'Brass 2'])
  })

  it('falls back to every image when a color has none', () => {
    expect(selectionImages(lamp, 'Green')).toHaveLength(3)
  })
})

describe('variantLabel', () => {
  it('joins the parts that exist', () => {
    expect(variantLabel({ color: 'Black', size: 'Large' })).toBe('Black · Large')
    expect(variantLabel({ color: 'Sage', size: null })).toBe('Sage')
  })
})

describe('updateVariantParams', () => {
  it('sets and clears values while keeping other params', () => {
    const next = updateVariantParams(params({ size: 'Small', ref: 'home' }), {
      color: 'Black',
      size: null,
    })
    expect(next.toString()).toBe('ref=home&color=Black')
  })
})
