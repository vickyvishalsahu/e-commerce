import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '@/lib/http'
import {
  categoryWithCountSchema,
  productListResponseSchema,
  productSchema,
  type ProductListQuery,
} from '@/lib/schemas/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  productList: (query: ProductListQuery) => [...catalogKeys.all, 'products', query] as const,
  product: (slug: string) => [...catalogKeys.all, 'product', slug] as const,
}

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
