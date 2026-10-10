import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { categoriesQueryOptions, productListQueryOptions } from '../api'
import { ProductGrid } from '../components/ProductGrid'
import { featuredProductsQuery } from '../loaders'

export function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions())
  const { data: featured } = useSuspenseQuery(productListQueryOptions(featuredProductsQuery))

  return (
    <div className="flex flex-col gap-16">
      <title>Storefront</title>
      <section className="flex flex-col gap-3 pt-4">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Well-made things for every room
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Cookware, furniture, lighting and textiles from small workshops, built to last for years.
        </p>
      </section>

      <section aria-labelledby="categories-heading" className="flex flex-col gap-6">
        <h2 id="categories-heading" className="font-heading text-2xl font-semibold tracking-tight">
          Shop by category
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={`/shop/${category.slug}`} className="group flex flex-col gap-2 rounded-lg">
                <div className="aspect-4/3 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={category.imageUrl}
                    alt=""
                    loading="lazy"
                    width={800}
                    height={600}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                  />
                </div>
                <span className="font-medium">{category.name}</span>
                <span className="-mt-2 text-sm text-muted-foreground">
                  {category.productCount} products
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured-heading" className="flex flex-col gap-6">
        <h2 id="featured-heading" className="font-heading text-2xl font-semibold tracking-tight">
          Featured
        </h2>
        <ProductGrid products={featured.items} />
      </section>
    </div>
  )
}
