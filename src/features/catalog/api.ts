import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '@/lib/http'
import {
  categoryWithCountSchema,
  productListResponseSchema,
  productSchema,
  productSummarySchema,
  reviewListResponseSchema,
  type ProductListQuery,
} from '@/lib/schemas/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  productList: (query: ProductListQuery) => [...catalogKeys.all, 'products', query] as const,
  product: (slug: string) => [...catalogKeys.all, 'product', slug] as const,
  reviews: (slug: string) => [...catalogKeys.product(slug), 'reviews'] as const,
  related: (slug: string) => [...catalogKeys.product(slug), 'related'] as const,
}

export const REVIEWS_PAGE_SIZE = 5

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.categories(),
    queryFn: () => request('/api/categories', { schema: z.array(categoryWithCountSchema) }),
    // The category list is fixed for the life of the app
    staleTime: Infinity,
  })
}

function toSearchParams(query: ProductListQuery) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return params
}

export function productListQueryOptions(query: ProductListQuery) {
  return queryOptions({
    queryKey: catalogKeys.productList(query),
    queryFn: () =>
      request(`/api/products?${toSearchParams(query)}`, {
        schema: productListResponseSchema,
      }),
  })
}

export function productQueryOptions(slug: string) {
  return queryOptions({
    queryKey: catalogKeys.product(slug),
    queryFn: () => request(`/api/products/${slug}`, { schema: productSchema }),
  })
}

export function reviewsQueryOptions(slug: string) {
  return infiniteQueryOptions({
    queryKey: catalogKeys.reviews(slug),
    queryFn: ({ pageParam }) =>
      request(`/api/products/${slug}/reviews?page=${pageParam}&pageSize=${REVIEWS_PAGE_SIZE}`, {
        schema: reviewListResponseSchema,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  })
}

export function relatedProductsQueryOptions(slug: string) {
  return queryOptions({
    queryKey: catalogKeys.related(slug),
    queryFn: () =>
      request(`/api/products/${slug}/related`, { schema: z.array(productSummarySchema) }),
  })
}
