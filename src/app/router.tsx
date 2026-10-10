import type { QueryClient } from '@tanstack/react-query'
import type { RouteObject } from 'react-router'
import { ListingSkeleton } from '@/features/catalog/components/ListingSkeleton'
import { categoryLoader, homeLoader, searchLoader } from '@/features/catalog/loaders'
import { CategoryPage } from '@/features/catalog/pages/CategoryPage'
import { HomePage } from '@/features/catalog/pages/HomePage'
import { SearchPage } from '@/features/catalog/pages/SearchPage'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './routes/NotFoundPage'
import { RouteErrorBoundary } from './routes/RouteErrorBoundary'

export function createRoutes(queryClient: QueryClient): RouteObject[] {
  return [
    {
      Component: AppLayout,
      // Catches errors in the layout itself, where the header can't be trusted to render
      ErrorBoundary: RouteErrorBoundary,
      children: [
        {
          // Page errors render inside the layout so the header stays available
          ErrorBoundary: RouteErrorBoundary,
          children: [
            {
              index: true,
              loader: homeLoader(queryClient),
              Component: HomePage,
              HydrateFallback: ListingSkeleton,
            },
            {
              path: 'shop/:category',
              loader: categoryLoader(queryClient),
              Component: CategoryPage,
              HydrateFallback: ListingSkeleton,
            },
            {
              path: 'search',
              loader: searchLoader(queryClient),
              Component: SearchPage,
              HydrateFallback: ListingSkeleton,
            },
            { path: '*', Component: NotFoundPage },
          ],
        },
      ],
    },
  ]
}
