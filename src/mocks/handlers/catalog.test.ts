import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  categoryWithCountSchema,
  productListResponseSchema,
  productSchema,
  productSummarySchema,
  reviewListResponseSchema,
} from '@/lib/schemas/catalog'
import { apiErrorSchema } from '@/lib/schemas/common'
import embeddingsJson from '@/mocks/data/product-embeddings.json'
import { catalog } from '@/mocks/db'
import { productEmbeddingsSchema } from '@/mocks/search/model'
import { setQueryEmbedder } from '@/mocks/search/search'
import { api } from '@/test/api'

async function listProducts(params: Record<string, string> = {}) {
  const { status, json } = await api(`/api/products?${new URLSearchParams(params)}`)
  expect(status).toBe(200)
  return productListResponseSchema.parse(json)
}

describe('GET /api/categories', () => {
  it('returns all categories with product counts', async () => {
    const { json } = await api('/api/categories')
    const categories = z.array(categoryWithCountSchema).parse(json)

    expect(categories).toHaveLength(8)
    expect(categories.reduce((sum, c) => sum + c.productCount, 0)).toBe(200)
  })
})

describe('GET /api/products', () => {
  it('paginates with 24 items by default', async () => {
    const result = await listProducts()

    expect(result.items).toHaveLength(24)
    expect(result.total).toBe(200)
    expect(result.totalPages).toBe(9)
  })

  it('returns the last partial page', async () => {
    const result = await listProducts({ page: '9' })

    expect(result.items).toHaveLength(8)
  })

  it('filters by category', async () => {
    const result = await listProducts({ category: 'kitchen', pageSize: '48' })

    expect(result.total).toBe(25)
    expect(result.items.every((item) => item.categorySlug === 'kitchen')).toBe(true)
  })

  it('returns 404 for an unknown category', async () => {
    const { status, json } = await api('/api/products?category=garage')

    expect(status).toBe(404)
    expect(apiErrorSchema.parse(json).error.code).toBe('not_found')
  })

  it('filters by price range in cents, inclusive', async () => {
    const result = await listProducts({ minPrice: '5000', maxPrice: '10000', pageSize: '48' })

    expect(result.total).toBeGreaterThan(0)
    for (const item of result.items) {
      expect(item.priceCents).toBeGreaterThanOrEqual(5000)
      expect(item.priceCents).toBeLessThanOrEqual(10000)
    }
  })

  it('keeps the price range of the whole scope when a price filter is applied', async () => {
    const unfiltered = await listProducts({ category: 'lighting' })
    const filtered = await listProducts({ category: 'lighting', minPrice: '20000' })

    expect(filtered.priceRange).toEqual(unfiltered.priceRange)
  })

  it('filters by minimum rating and stock', async () => {
    const result = await listProducts({ rating: '4', inStock: 'true', pageSize: '48' })

    for (const item of result.items) {
      expect(item.rating.average).toBeGreaterThanOrEqual(4)
      expect(item.inStock).toBe(true)
    }
  })

  it('finds products from a sentence, ignoring filler words', async () => {
    const result = await listProducts({ q: 'I need something to boil water for tea' })

    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((item) => item.name.endsWith('Kettle'))).toBe(true)
  })

  it('finds nothing for gibberish', async () => {
    const result = await listProducts({ q: 'qwzx' })

    expect(result.total).toBe(0)
  })

  it('ranks by meaning when the search model is available', async () => {
    const { vectors } = productEmbeddingsSchema.parse(embeddingsJson)
    const prepBoard = catalog.products.find((p) => p.name === 'Acacia Prep Board with Scrap Drawer')
    const vector = prepBoard && vectors[prepBoard.id]
    if (!vector) throw new Error('Missing the prep board fixture')
    // A query that means exactly what the prep board is for, without sharing its name
    setQueryEmbedder(() => Promise.resolve(Float32Array.from(vector)))

    const result = await listProducts({ q: 'somewhere to put scraps while I cook' })

    expect(result.items.map((item) => item.name)).toContain('Acacia Prep Board with Scrap Drawer')
    expect(result.total).toBeLessThan(25)
  })

  it('applies filters and paging to search results', async () => {
    const all = await listProducts({ q: 'linen', pageSize: '48' })
    const page = await listProducts({ q: 'linen', pageSize: '5', page: '2', maxPrice: '20000' })

    expect(page.total).toBeLessThan(all.total)
    expect(page.items).toHaveLength(5)
    expect(page.priceRange).toEqual(all.priceRange)
    expect(page.items.every((item) => item.priceCents <= 20000)).toBe(true)
  })

  it('searches case-insensitively', async () => {
    const lower = await listProducts({ q: 'dutch oven' })
    const upper = await listProducts({ q: 'DUTCH OVEN' })

    expect(lower.total).toBeGreaterThan(0)
    expect(upper.total).toBe(lower.total)
  })

  it('sorts by price ascending', async () => {
    const { items } = await listProducts({ sort: 'price-asc', pageSize: '48' })
    const prices = items.map((item) => item.priceCents)

    expect(prices).toEqual(prices.toSorted((a, b) => a - b))
  })

  it('sorts by price descending', async () => {
    const { items } = await listProducts({ sort: 'price-desc', pageSize: '48' })
    const prices = items.map((item) => item.priceCents)

    expect(prices).toEqual(prices.toSorted((a, b) => b - a))
  })

  it('lists featured products first by default', async () => {
    const featured = await listProducts({ featured: 'true' })
    const { items } = await listProducts()

    expect(items.slice(0, featured.total).map((i) => i.id)).toEqual(featured.items.map((i) => i.id))
  })

  it('rejects an inverted price range', async () => {
    const { status, json } = await api('/api/products?minPrice=500&maxPrice=100')

    expect(status).toBe(400)
    expect(apiErrorSchema.parse(json).error.fieldErrors).toHaveProperty('minPrice')
  })

  it('rejects a page size over 48', async () => {
    const { status } = await api('/api/products?pageSize=100')

    expect(status).toBe(400)
  })
})

describe('GET /api/products/:slug', () => {
  it('returns the full product', async () => {
    const { items } = await listProducts()
    const slug = items[0]?.slug ?? ''

    const { status, json } = await api(`/api/products/${slug}`)

    expect(status).toBe(200)
    expect(productSchema.parse(json).slug).toBe(slug)
  })

  it('returns 404 for an unknown slug', async () => {
    const { status } = await api('/api/products/does-not-exist')

    expect(status).toBe(404)
  })
})

describe('GET /api/products/:slug/reviews', () => {
  it('paginates newest first with a rating distribution', async () => {
    const { items } = await listProducts({ sort: 'rating' })
    const product = items.find((item) => item.rating.count > 5)
    if (!product) throw new Error('Expected a product with more than 5 reviews')

    const { json } = await api(`/api/products/${product.slug}/reviews`)
    const reviews = reviewListResponseSchema.parse(json)

    expect(reviews.items).toHaveLength(5)
    expect(reviews.total).toBe(product.rating.count)
    expect(reviews.distribution.reduce((sum, d) => sum + d.count, 0)).toBe(product.rating.count)
    const dates = reviews.items.map((review) => review.createdAt)
    expect(dates).toEqual(dates.toSorted().toReversed())
  })
})

describe('GET /api/products/:slug/related', () => {
  it('returns up to 4 other products from the same category', async () => {
    const { items } = await listProducts({ category: 'bath' })
    const product = items[0]
    if (!product) throw new Error('Expected a bath product')

    const { json } = await api(`/api/products/${product.slug}/related`)
    const related = z.array(productSummarySchema).parse(json)

    expect(related).toHaveLength(4)
    expect(related.every((p) => p.categorySlug === 'bath' && p.id !== product.id)).toBe(true)
  })
})
