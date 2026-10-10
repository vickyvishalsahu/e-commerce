import type { QueryClient } from '@tanstack/react-query'
import type { LoaderFunctionArgs } from 'react-router'
import { ApiError } from '@/lib/http'
import type { ProductListQuery } from '@/lib/schemas/catalog'
import {
  categoriesQueryOptions,
  productListQueryOptions,
  productQueryOptions,
  relatedProductsQueryOptions,
  reviewsQueryOptions,
} from './api'
import { parseListingParams, toProductListQuery } from './listing-params'

export const featuredProductsQuery: ProductListQuery = {
  featured: true,
  sort: 'featured',
  page: 1,
  pageSize: 8,
}

export function categoryNotFound() {
  return new ApiError(404, { code: 'not_found', message: 'Category not found' })
}

// Loaders only warm the query cache; components read the same queries with useSuspenseQuery
export function homeLoader(queryClient: QueryClient) {
  return async () => {
    await Promise.all([
      queryClient.ensureQueryData({ ...categoriesQueryOptions(), revalidateIfStale: true }),
      queryClient.ensureQueryData({
        ...productListQueryOptions(featuredProductsQuery),
        revalidateIfStale: true,
      }),
    ])
    return null
  }
}

export function categoryLoader(queryClient: QueryClient) {
  return async ({ params, request }: LoaderFunctionArgs) => {
    const categories = await queryClient.ensureQueryData(categoriesQueryOptions())
    if (!categories.some((category) => category.slug === params.category)) throw categoryNotFound()

    const listing = parseListingParams(new URL(request.url).searchParams)
    await queryClient.ensureQueryData({
      ...productListQueryOptions(toProductListQuery(listing, { category: params.category })),
      revalidateIfStale: true,
    })
    return null
  }
}

export function searchLoader(queryClient: QueryClient) {
  return async ({ request }: LoaderFunctionArgs) => {
    const listing = parseListingParams(new URL(request.url).searchParams)
    await Promise.all([
      queryClient.ensureQueryData(categoriesQueryOptions()),
      listing.q &&
        queryClient.ensureQueryData({
          ...productListQueryOptions(toProductListQuery(listing, {})),
          revalidateIfStale: true,
        }),
    ])
    return null
  }
}

export function productLoader(queryClient: QueryClient) {
  return async ({ params }: LoaderFunctionArgs) => {
    const slug = params.slug ?? ''
    // Below-the-fold sections start loading now but don't hold up the page
    void queryClient.prefetchInfiniteQuery(reviewsQueryOptions(slug))
    void queryClient.prefetchQuery(relatedProductsQueryOptions(slug))
    await Promise.all([
      queryClient.ensureQueryData({ ...productQueryOptions(slug), revalidateIfStale: true }),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ])
    return null
  }
}
