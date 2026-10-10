import { HttpResponse, http } from 'msw'
import {
  productListQuerySchema,
  reviewListQuerySchema,
  type ReviewListResponse,
} from '@/lib/schemas/catalog'
import {
  findCategory,
  findProductBySlug,
  listCategories,
  queryProducts,
  relatedProducts,
} from '../catalog'
import { catalog } from '../db'
import { notFound, readQuery, validationError } from '../responses'

const RELATED_PRODUCT_COUNT = 4

export const catalogHandlers = [
  http.get('/api/categories', () => HttpResponse.json(listCategories())),

  http.get('/api/products', ({ request }) => {
    const query = readQuery(request, productListQuerySchema)
    if (!query.success) return validationError(query.error)
    if (query.data.category && !findCategory(query.data.category)) {
      return notFound('Category not found')
    }
    return HttpResponse.json(queryProducts(query.data))
  }),

  http.get<{ slug: string }>('/api/products/:slug', ({ params }) => {
    const product = findProductBySlug(params.slug)
    return product ? HttpResponse.json(product) : notFound('Product not found')
  }),

  http.get<{ slug: string }>('/api/products/:slug/reviews', ({ params, request }) => {
    const product = findProductBySlug(params.slug)
    if (!product) return notFound('Product not found')
    const query = readQuery(request, reviewListQuerySchema)
    if (!query.success) return validationError(query.error)

    const reviews = catalog.reviews
      .filter((review) => review.productId === product.id)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    const { page, pageSize } = query.data
    const start = (page - 1) * pageSize
    const body: ReviewListResponse = {
      items: reviews.slice(start, start + pageSize).map(({ productId, ...review }) => review),
      page,
      pageSize,
      total: reviews.length,
      totalPages: Math.ceil(reviews.length / pageSize),
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: reviews.filter((review) => review.rating === stars).length,
      })),
    }
    return HttpResponse.json(body)
  }),

  http.get<{ slug: string }>('/api/products/:slug/related', ({ params }) => {
    const product = findProductBySlug(params.slug)
    if (!product) return notFound('Product not found')
    return HttpResponse.json(relatedProducts(product, RELATED_PRODUCT_COUNT))
  }),
]
