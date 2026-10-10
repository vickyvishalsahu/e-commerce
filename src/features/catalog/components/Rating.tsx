import { StarIcon } from 'lucide-react'
import type { ProductSummary } from '@/lib/schemas/catalog'

export function Rating({ rating }: { rating: ProductSummary['rating'] }) {
  if (rating.count === 0) {
    return <p className="text-xs text-muted-foreground">No reviews yet</p>
  }

  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <StarIcon aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
      <span aria-hidden className="tabular-nums">
        {rating.average.toFixed(1)} ({rating.count})
      </span>
      <span className="sr-only">
        Rated {rating.average.toFixed(1)} out of 5 from {rating.count}{' '}
        {rating.count === 1 ? 'review' : 'reviews'}
      </span>
    </p>
  )
}
