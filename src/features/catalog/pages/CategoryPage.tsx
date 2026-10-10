import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router'
import { categoriesQueryOptions } from '../api'
import { ProductListing } from '../components/ProductListing'
import { parseListingParams, toProductListQuery } from '../listing-params'
import { categoryNotFound } from '../loaders'

export function CategoryPage() {
  const { category: slug } = useParams()
  const [searchParams] = useSearchParams()
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions())

  const category = categories.find((c) => c.slug === slug)
  if (!category) throw categoryNotFound()
  const params = parseListingParams(searchParams)

  return (
    <>
      <title>{`${category.name} · Storefront`}</title>
      <ProductListing
        heading={category.name}
        description={category.description}
        query={toProductListQuery(params, { category: category.slug })}
        params={params}
        emptyState={<p className="text-muted-foreground">No products here yet.</p>}
      />
    </>
  )
}
