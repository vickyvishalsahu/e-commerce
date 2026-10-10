import type { RouteObject } from 'react-router'
import { AppLayout } from './layout/AppLayout'
import { HomePage } from './routes/HomePage'
import { NotFoundPage } from './routes/NotFoundPage'
import { RouteErrorBoundary } from './routes/RouteErrorBoundary'

export const routes: RouteObject[] = [
  {
    Component: AppLayout,
    // Catches errors in the layout itself, where the header can't be trusted to render
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        // Page errors render inside the layout so the header stays available
        ErrorBoundary: RouteErrorBoundary,
        children: [
          { index: true, Component: HomePage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]
