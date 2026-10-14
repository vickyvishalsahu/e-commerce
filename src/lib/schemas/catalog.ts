import { z } from 'zod'
import { centsSchema, paginatedSchema } from './common'

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.url(),
})

export const categoryWithCountSchema = categorySchema.extend({
  productCount: z.int().nonnegative(),
})

export const colorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export const productImageSchema = z.object({
  url: z.url(),
  alt: z.string(),
  color: z.string().nullable(),
})

export const variantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  priceCents: centsSchema,
  compareAtPriceCents: centsSchema.nullable(),
  stock: z.int().nonnegative(),
})

export const ratingSchema = z.object({
  average: z.number().min(0).max(5),
  count: z.int().nonnegative(),
})

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  details: z.array(z.string()),
  categoryId: z.string(),
  categorySlug: z.string(),
  colors: z.array(colorSchema),
  sizes: z.array(z.string()),
  images: z.array(productImageSchema).min(1),
  variants: z.array(variantSchema).min(1),
  rating: ratingSchema,
  featured: z.boolean(),
  createdAt: z.iso.datetime(),
})

export const productSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  categorySlug: z.string(),
  imageUrl: z.url(),
  imageAlt: z.string(),
  priceCents: centsSchema,
  compareAtPriceCents: centsSchema.nullable(),
  hasPriceRange: z.boolean(),
  colors: z.array(colorSchema),
  rating: ratingSchema,
  inStock: z.boolean(),
})

export const productSortSchema = z.enum([
  'relevance',
  'featured',
  'newest',
  'price-asc',
  'price-desc',
  'rating',
])

/** Searches rank by relevance unless asked otherwise; without a search there's nothing to rank by */
export function resolveProductSort(
  sort: z.infer<typeof productSortSchema> | undefined,
  q?: string,
) {
  if (q === undefined) return sort === undefined || sort === 'relevance' ? 'featured' : sort
  return sort ?? 'relevance'
}

export const productListQuerySchema = z
  .object({
    category: z.string().min(1).optional(),
    q: z.string().trim().min(1).optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    rating: z.coerce.number().int().min(1).max(4).optional(),
    inStock: z.stringbool().optional(),
    featured: z.stringbool().optional(),
    sort: productSortSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(24),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: 'minPrice must not exceed maxPrice', path: ['minPrice'] },
  )
  .transform((query) => ({ ...query, sort: resolveProductSort(query.sort, query.q) }))

export const productListResponseSchema = paginatedSchema(productSummarySchema).extend({
  priceRange: z.object({ minCents: centsSchema, maxCents: centsSchema }),
})

export const reviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.int().min(1).max(5),
  title: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
})

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(5),
})

export const reviewListResponseSchema = paginatedSchema(reviewSchema).extend({
  distribution: z.array(z.object({ stars: z.int().min(1).max(5), count: z.int().nonnegative() })),
})

export const catalogSeedSchema = z.object({
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  reviews: z.array(reviewSchema.extend({ productId: z.string() })),
})

export type Category = z.infer<typeof categorySchema>
export type CategoryWithCount = z.infer<typeof categoryWithCountSchema>
export type Color = z.infer<typeof colorSchema>
export type ProductImage = z.infer<typeof productImageSchema>
export type Variant = z.infer<typeof variantSchema>
export type Product = z.infer<typeof productSchema>
export type ProductSummary = z.infer<typeof productSummarySchema>
export type ProductSort = z.infer<typeof productSortSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
export type ProductListResponse = z.infer<typeof productListResponseSchema>
export type Review = z.infer<typeof reviewSchema>
export type ReviewListResponse = z.infer<typeof reviewListResponseSchema>
export type CatalogSeed = z.infer<typeof catalogSeedSchema>
