import { describe, expect, it } from 'vitest'
import { catalogSeedSchema } from '@/lib/schemas/catalog'
import catalogJson from './catalog.json'

describe('catalog seed', () => {
  const catalog = catalogSeedSchema.parse(catalogJson)

  it('has 200 products across 8 categories', () => {
    expect(catalog.categories).toHaveLength(8)
    expect(catalog.products).toHaveLength(200)
  })

  it('uses unique product slugs and variant ids', () => {
    const slugs = catalog.products.map((product) => product.slug)
    const variantIds = catalog.products.flatMap((product) => product.variants.map((v) => v.id))

    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(variantIds).size).toBe(variantIds.length)
  })

  it('offers a variant for every color and size combination', () => {
    for (const product of catalog.products) {
      const sizeCount = Math.max(product.sizes.length, 1)
      expect(product.variants).toHaveLength(product.colors.length * sizeCount)
    }
  })

  it('has images for every color', () => {
    for (const product of catalog.products) {
      for (const color of product.colors) {
        expect(product.images.some((image) => image.color === color.name)).toBe(true)
      }
    }
  })

  it('keeps ratings consistent with reviews', () => {
    for (const product of catalog.products) {
      const productReviews = catalog.reviews.filter((review) => review.productId === product.id)
      expect(product.rating.count).toBe(productReviews.length)
    }
  })

  it('points every product at an existing category', () => {
    const categoryIds = new Set(catalog.categories.map((category) => category.id))

    for (const product of catalog.products) {
      expect(categoryIds.has(product.categoryId)).toBe(true)
    }
  })
})
