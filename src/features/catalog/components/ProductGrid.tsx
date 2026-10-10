import { Skeleton } from '@/components/ui/skeleton'
import type { ProductSummary } from '@/lib/schemas/catalog'
import { ProductCard } from './ProductCard'

const gridClassName = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4'

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className={gridClassName}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}

export function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <ul aria-hidden className={gridClassName}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-4/5 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </li>
      ))}
    </ul>
  )
}
