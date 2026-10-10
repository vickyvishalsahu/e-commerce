import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { categoriesQueryOptions } from '../api'
import { ProductListing } from '../components/ProductListing'
import { parseListingParams, toProductListQuery } from '../listing-params'

function CategorySuggestions() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions())

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {categories.map((category) => (
        <li key={category.id}>
          <Link to={`/shop/${category.slug}`} className="underline underline-offset-4">
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const params = parseListingParams(searchParams)

  if (!params.q) {
    return (
      <section className="flex flex-col gap-4 py-8">
        <title>Search · Storefront</title>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Use the search box above, or browse a category.</p>
        <CategorySuggestions />
      </section>
    )
  }

  return (
    <>
      <title>{`Results for “${params.q}” · Storefront`}</title>
      <ProductListing
        heading={`Results for “${params.q}”`}
        query={toProductListQuery(params, {})}
        params={params}
        emptyState={
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
            <h2 className="font-medium">No results for “{params.q}”</h2>
            <p className="text-sm text-muted-foreground">
              Check the spelling, try a more general word, or browse a category.
            </p>
            <CategorySuggestions />
          </div>
        }
      />
    </>
  )
}
