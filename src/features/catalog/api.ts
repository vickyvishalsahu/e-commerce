import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '@/lib/http'
import { categoryWithCountSchema } from '@/lib/schemas/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
}

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.categories(),
    queryFn: () => request('/api/categories', { schema: z.array(categoryWithCountSchema) }),
    // The category list is fixed for the life of the app
    staleTime: Infinity,
  })
}
