import { useSuspenseQuery } from '@tanstack/react-query'
import { cn } from 'cn'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigation, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ProductListQuery } from '@/lib/schemas/catalog'
import { productListQueryOptions } from '../api'
import { countActiveFilters, updateListingParams, type ListingParams } from '../listing-params'
import { useListingNavigation } from '../use-listing-navigation'
import { ActiveFilters } from './ActiveFilters'
import { FiltersSheet } from './FiltersSheet'
import { ListingFilters } from './ListingFilters'
import { Pagination } from './Pagination'
import { ProductGrid } from './ProductGrid'
import { SortSelect } from './SortSelect'

interface ProductListingProps {
  heading: string
  description?: string
  query: ProductListQuery
  params: ListingParams
  /** Shown when nothing matches and no filters are applied */
  emptyState: ReactNode
}

function EmptyMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
      <h2 className="font-medium">{title}</h2>
      {children}
    </div>
  )
}

export function ProductListing({
  heading,
  description,
  query,
  params,
  emptyState,
}: ProductListingProps) {
  const { data } = useSuspenseQuery(productListQueryOptions(query))
  const { clearFilters } = useListingNavigation()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigation = useNavigation()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownPage = useRef(params.page)

  // Keep the current results on screen, dimmed, while the next set loads
  const isUpdating =
    navigation.state === 'loading' && navigation.location.pathname === location.pathname

  // After paging, move focus to the top of the results so keyboard and screen reader users follow
  useEffect(() => {
    if (shownPage.current === params.page) return
    shownPage.current = params.page
    headingRef.current?.focus()
  }, [params.page])

  const countLabel = `${data.total} ${data.total === 1 ? 'product' : 'products'}`
  // With nothing to narrow down, filters and sorting are just noise
  const showControls = data.total > 0 || countActiveFilters(params) > 0

  function renderResults() {
    if (data.items.length > 0) return <ProductGrid products={data.items} />
    if (data.total > 0) {
      return (
        <EmptyMessage title="This page doesn't exist">
          <p className="text-sm text-muted-foreground">There are only {data.totalPages} pages.</p>
          <Button asChild variant="outline">
            <Link to={`?${updateListingParams(searchParams, { page: 1 })}`}>Go to page 1</Link>
          </Button>
        </EmptyMessage>
      )
    }
    if (countActiveFilters(params) > 0) {
      return (
        <EmptyMessage title="No products match these filters">
          <p className="text-sm text-muted-foreground">Try a wider price range or fewer filters.</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyMessage>
      )
    }
    return emptyState
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-3xl font-semibold tracking-tight outline-none"
        >
          {heading}
        </h1>
        {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {countLabel}
        </p>
        {showControls && (
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <FiltersSheet params={params} priceRange={data.priceRange} total={data.total} />
            </div>
            <SortSelect sort={params.sort} searching={params.q !== undefined} />
          </div>
        )}
      </div>

      <div className={cn('grid gap-8', showControls && 'lg:grid-cols-[14rem_1fr]')}>
        {showControls && (
          <aside aria-label="Filters" className="hidden lg:block">
            <ListingFilters params={params} priceRange={data.priceRange} idPrefix="sidebar" />
          </aside>
        )}
        <section aria-label="Results" aria-busy={isUpdating} className="flex flex-col gap-6">
          <ActiveFilters params={params} />
          <div className={cn('transition-opacity', isUpdating && 'opacity-60')}>
            {renderResults()}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} />
        </section>
      </div>
    </div>
  )
}
