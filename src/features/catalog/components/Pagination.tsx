import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { updateListingParams } from '../listing-params'
import { pageWindow } from '../page-window'

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const [searchParams] = useSearchParams()
  if (totalPages <= 1) return null

  const hrefFor = (target: number) => `?${updateListingParams(searchParams, { page: target })}`

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Button asChild variant="ghost" size="icon">
          <Link to={hrefFor(page - 1)} aria-label="Previous page">
            <ChevronLeftIcon aria-hidden />
          </Link>
        </Button>
      ) : (
        <span className="size-8" aria-hidden />
      )}
      <ul className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((p, index) =>
          p === null ? (
            <li key={`gap-${index}`} aria-hidden className="px-2 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <Button asChild variant={p === page ? 'outline' : 'ghost'} size="icon">
                <Link
                  to={hrefFor(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </Link>
              </Button>
            </li>
          ),
        )}
      </ul>
      {page < totalPages ? (
        <Button asChild variant="ghost" size="icon">
          <Link to={hrefFor(page + 1)} aria-label="Next page">
            <ChevronRightIcon aria-hidden />
          </Link>
        </Button>
      ) : (
        <span className="size-8" aria-hidden />
      )}
    </nav>
  )
}
