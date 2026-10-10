import { useQuery } from '@tanstack/react-query'
import { relatedProductsQueryOptions } from '../api'
import { ProductGrid, ProductGridSkeleton } from './ProductGrid'

export function RelatedProducts({ slug }: { slug: string }) {
  const { data, isPending, error } = useQuery(relatedProductsQueryOptions(slug))

  // Recommendations are optional: if they fail or there are none, the page reads fine without them
  if (error || data?.length === 0) return null

  return (
    <section aria-labelledby="related-heading" className="flex flex-col gap-6">
      <h2 id="related-heading" className="font-heading text-2xl font-semibold tracking-tight">
        You may also like
      </h2>
      {isPending ? <ProductGridSkeleton count={4} /> : <ProductGrid products={data} />}
    </section>
  )
}
