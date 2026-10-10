import { useInfiniteQuery } from '@tanstack/react-query'
import { StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { Product, Review } from '@/lib/schemas/catalog'
import { reviewsQueryOptions } from '../api'

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={
            star <= Math.round(rating)
              ? 'size-4 fill-amber-400 text-amber-400'
              : 'size-4 text-muted-foreground/40'
          }
        />
      ))}
    </span>
  )
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <article className="flex flex-col gap-2 border-b py-6 last:border-b-0">
      <Stars rating={review.rating} />
      <span className="sr-only">Rated {review.rating} out of 5</span>
      <h3 className="font-medium">{review.title}</h3>
      <p className="text-sm text-muted-foreground">
        {review.author} · <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
      </p>
      <p className="max-w-prose text-sm leading-relaxed">{review.body}</p>
    </article>
  )
}

function ReviewsSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">Loading reviews</span>
      {[1, 2].map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ProductReviews({ product }: { product: Product }) {
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(reviewsQueryOptions(product.slug))

  function renderBody() {
    if (isPending) return <ReviewsSkeleton />
    if (error) {
      return (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Reviews couldn't load.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )
    }

    const reviews = data.pages.flatMap((page) => page.items)
    const firstPage = data.pages[0]
    if (!firstPage || firstPage.total === 0) {
      return <p className="text-muted-foreground">No reviews yet.</p>
    }

    return (
      <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">
              {product.rating.average.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">out of 5</span>
          </p>
          <Stars rating={product.rating.average} />
          <p className="text-sm text-muted-foreground">
            {firstPage.total} {firstPage.total === 1 ? 'review' : 'reviews'}
          </p>
          <ul aria-label="Rating breakdown" className="flex flex-col gap-1.5 pt-2">
            {firstPage.distribution.map(({ stars, count }) => (
              <li key={stars} className="flex items-center gap-2 text-sm">
                <span aria-hidden className="w-12 tabular-nums">
                  {stars} star
                </span>
                <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${(count / firstPage.total) * 100}%` }}
                  />
                </span>
                <span aria-hidden className="w-8 text-right text-muted-foreground tabular-nums">
                  {count}
                </span>
                <span className="sr-only">
                  {stars} {stars === 1 ? 'star' : 'stars'}: {count}{' '}
                  {count === 1 ? 'review' : 'reviews'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start">
          <div className="w-full">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
          {hasNextPage && (
            <Button
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading…' : 'Show more reviews'}
            </Button>
          )}
          <p aria-live="polite" className="pt-3 text-sm text-muted-foreground">
            Showing {reviews.length} of {firstPage.total}
          </p>
        </div>
      </div>
    )
  }

  return (
    <section aria-labelledby="reviews-heading" id="reviews" className="flex flex-col gap-6">
      <h2 id="reviews-heading" className="font-heading text-2xl font-semibold tracking-tight">
        Reviews
      </h2>
      {renderBody()}
    </section>
  )
}
