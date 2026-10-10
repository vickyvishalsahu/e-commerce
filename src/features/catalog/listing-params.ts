import { z } from 'zod'
import { productSortSchema, type ProductListQuery } from '@/lib/schemas/catalog'

export const LISTING_PAGE_SIZE = 24

/** Treats `?min=` like a missing param instead of coercing it to 0. */
function optionalParam<T extends z.ZodType>(schema: T) {
  return z
    .preprocess((value) => (value === '' ? undefined : value), schema.optional())
    .catch(undefined)
}

// Lenient on purpose: a stale or hand-edited URL drops bad values instead of erroring
const listingParamsSchema = z
  .object({
    q: optionalParam(z.string().trim().min(1)),
    sort: productSortSchema.catch('featured'),
    page: z.coerce.number().int().min(1).catch(1),
    min: optionalParam(z.coerce.number().int().nonnegative()),
    max: optionalParam(z.coerce.number().int().nonnegative()),
    rating: optionalParam(z.coerce.number().int().min(1).max(4)),
    inStock: z
      .literal('true')
      .optional()
      .catch(undefined)
      .transform((value) => value === 'true'),
  })
  .transform((params) =>
    params.min !== undefined && params.max !== undefined && params.min > params.max
      ? { ...params, min: params.max, max: params.min }
      : params,
  )

export type ListingParams = z.infer<typeof listingParamsSchema>
type ListingParamChanges = Partial<Omit<ListingParams, 'q'>>

export function parseListingParams(searchParams: URLSearchParams): ListingParams {
  return listingParamsSchema.parse(Object.fromEntries(searchParams))
}

/** URL params are whole dollars for readability; the API takes cents. */
export function toProductListQuery(
  params: ListingParams,
  scope: { category?: string },
): ProductListQuery {
  return {
    category: scope.category,
    q: params.q,
    sort: params.sort,
    page: params.page,
    pageSize: LISTING_PAGE_SIZE,
    minPrice: params.min === undefined ? undefined : params.min * 100,
    maxPrice: params.max === undefined ? undefined : params.max * 100,
    rating: params.rating,
    inStock: params.inStock || undefined,
  }
}

/**
 * Returns new search params with `changes` applied. Any change other than the page itself
 * sends the shopper back to page 1. Default values are left out to keep URLs short.
 */
export function updateListingParams(current: URLSearchParams, changes: ListingParamChanges) {
  const next = new URLSearchParams(current)
  const set = (key: string, value: string | undefined) => {
    if (value === undefined) next.delete(key)
    else next.set(key, value)
  }

  for (const [key, value] of Object.entries(changes)) {
    if (key === 'sort') set(key, value === 'featured' ? undefined : String(value))
    else if (key === 'inStock') set(key, value ? 'true' : undefined)
    else if (key === 'page') set(key, value === 1 ? undefined : String(value))
    else set(key, value === undefined ? undefined : String(value))
  }
  if (!('page' in changes)) next.delete('page')
  return next
}

export function clearListingFilters(current: URLSearchParams) {
  return updateListingParams(current, {
    min: undefined,
    max: undefined,
    rating: undefined,
    inStock: false,
  })
}

export function countActiveFilters(params: ListingParams) {
  const priceFilter = params.min !== undefined || params.max !== undefined
  return [priceFilter, params.rating !== undefined, params.inStock].filter(Boolean).length
}
