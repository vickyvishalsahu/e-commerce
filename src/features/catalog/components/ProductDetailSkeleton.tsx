import { Skeleton } from '@/components/ui/skeleton'

export function ProductDetailSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only">Loading product</span>
      <Skeleton className="h-4 w-56" />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <Skeleton className="aspect-4/5 w-full rounded-lg lg:flex-1" />
          <div className="flex gap-3 lg:flex-col">
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="aspect-4/5 w-20 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
