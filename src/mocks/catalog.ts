import type {
  CategoryWithCount,
  Product,
  ProductListQuery,
  ProductListResponse,
  ProductSummary,
  Variant,
} from '@/lib/schemas/catalog'
import { catalog, db } from './db'

function withLiveStock(product: Product): Product {
  const { stock } = db()
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      stock: stock[variant.id] ?? 0,
    })),
  }
}

export function listCategories(): CategoryWithCount[] {
  return catalog.categories.map((category) => ({
    ...category,
    productCount: catalog.products.filter((p) => p.categoryId === category.id).length,
  }))
}

export function findCategory(slug: string) {
  return catalog.categories.find((category) => category.slug === slug)
}

export function findProductBySlug(slug: string) {
  const product = catalog.products.find((p) => p.slug === slug)
  return product && withLiveStock(product)
}

export function findProductById(id: string) {
  const product = catalog.products.find((p) => p.id === id)
  return product && withLiveStock(product)
}

export function findVariant(variantId: string): { product: Product; variant: Variant } | undefined {
  const product = catalog.products.find((p) => p.variants.some((v) => v.id === variantId))
  if (!product) return undefined
  const live = withLiveStock(product)
  const variant = live.variants.find((v) => v.id === variantId)
  return variant && { product: live, variant }
}

export function variantLabel(variant: Variant) {
  return [variant.color, variant.size].filter((part) => part !== null).join(' · ')
}

export function variantImage(product: Product, variant: Variant) {
  const image = product.images.find((img) => img.color === variant.color) ?? product.images[0]
  if (!image) throw new Error(`Product ${product.id} has no images`)
  return image
}

export function toSummary(product: Product): ProductSummary {
  const cheapest = product.variants.reduce((min, v) => (v.priceCents < min.priceCents ? v : min))
  const image = variantImage(product, cheapest)
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categorySlug: product.categorySlug,
    imageUrl: image.url,
    imageAlt: image.alt,
    priceCents: cheapest.priceCents,
    compareAtPriceCents: cheapest.compareAtPriceCents,
    hasPriceRange: product.variants.some((v) => v.priceCents !== cheapest.priceCents),
    colors: product.colors,
    rating: product.rating,
    inStock: product.variants.some((v) => v.stock > 0),
  }
}

export function relatedProducts(product: Product, count: number): ProductSummary[] {
  return catalog.products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .toSorted((a, b) => b.rating.average - a.rating.average)
    .slice(0, count)
    .map((p) => toSummary(withLiveStock(p)))
}

function matchesSearch(product: Product, query: string) {
  const category = findCategory(product.categorySlug)
  const haystack = `${product.name} ${category?.name ?? ''} ${product.description}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}

interface ListEntry {
  product: Product
  summary: ProductSummary
}

const sorters: Record<ProductListQuery['sort'], (a: ListEntry, b: ListEntry) => number> = {
  featured: (a, b) => Number(b.product.featured) - Number(a.product.featured),
  newest: (a, b) => b.product.createdAt.localeCompare(a.product.createdAt),
  'price-asc': (a, b) =>
    a.summary.priceCents - b.summary.priceCents || a.summary.name.localeCompare(b.summary.name),
  'price-desc': (a, b) =>
    b.summary.priceCents - a.summary.priceCents || a.summary.name.localeCompare(b.summary.name),
  rating: (a, b) =>
    b.summary.rating.average - a.summary.rating.average ||
    b.summary.rating.count - a.summary.rating.count,
}

export function queryProducts(query: ProductListQuery): ProductListResponse {
  const { category, featured, q, minPrice, maxPrice, rating, inStock } = query

  // Price bounds describe the category and search scope, before the price filter narrows it
  const scoped = catalog.products
    .map(withLiveStock)
    .filter((p) => category === undefined || p.categorySlug === category)
    .filter((p) => featured === undefined || p.featured === featured)
    .filter((p) => q === undefined || matchesSearch(p, q))
    .map((product) => ({ product, summary: toSummary(product) }))

  const prices = scoped.map(({ summary }) => summary.priceCents)
  const priceRange = {
    minCents: prices.length > 0 ? Math.min(...prices) : 0,
    maxCents: prices.length > 0 ? Math.max(...prices) : 0,
  }

  const matches = scoped
    .filter(({ summary }) => minPrice === undefined || summary.priceCents >= minPrice)
    .filter(({ summary }) => maxPrice === undefined || summary.priceCents <= maxPrice)
    .filter(({ summary }) => rating === undefined || summary.rating.average >= rating)
    .filter(({ summary }) => !inStock || summary.inStock)
    .toSorted(sorters[query.sort])

  const start = (query.page - 1) * query.pageSize
  return {
    items: matches.slice(start, start + query.pageSize).map(({ summary }) => summary),
    page: query.page,
    pageSize: query.pageSize,
    total: matches.length,
    totalPages: Math.ceil(matches.length / query.pageSize),
    priceRange,
  }
}
