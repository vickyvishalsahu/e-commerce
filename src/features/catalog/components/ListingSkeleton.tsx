import { Skeleton } from '@/components/ui/skeleton'
import { LISTING_PAGE_SIZE } from '../listing-params'
import { ProductGridSkeleton } from './ProductGrid'

export function ListingSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">Loading products</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-9 w-full" />
      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <div className="hidden flex-col gap-4 lg:flex">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <ProductGridSkeleton count={LISTING_PAGE_SIZE / 2} />
      </div>
    </div>
  )
}
