import { useSuspenseQuery } from '@tanstack/react-query'
import { ChevronRightIcon } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { categoriesQueryOptions, productQueryOptions } from '../api'
import { PriceTag } from '../components/PriceTag'
import { ProductGallery } from '../components/ProductGallery'
import { ProductPurchase } from '../components/ProductPurchase'
import { ProductReviews } from '../components/ProductReviews'
import { Rating } from '../components/Rating'
import { RelatedProducts } from '../components/RelatedProducts'
import { parseVariantSelection, selectionImages, selectionPrice } from '../variant-selection'

export function ProductPage() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data: product } = useSuspenseQuery(productQueryOptions(slug))
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions())

  const category = categories.find((c) => c.slug === product.categorySlug)
  const selection = parseVariantSelection(searchParams, product)
  const price = selectionPrice(product, selection)

  return (
    <div className="flex flex-col gap-16">
      <title>{`${product.name} · Storefront`}</title>
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            {category && (
              <li className="flex items-center gap-1.5">
                <ChevronRightIcon aria-hidden className="size-3.5" />
                <Link to={`/shop/${category.slug}`} className="hover:text-foreground">
                  {category.name}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon aria-hidden className="size-3.5" />
              <span aria-current="page" className="text-foreground">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        <article aria-labelledby="product-heading" className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Keyed so switching color or product starts the gallery on the first image */}
          <ProductGallery
            key={`${product.id}-${selection.color}`}
            images={selectionImages(product, selection.color)}
          />
          <div className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
            <div className="flex flex-col gap-3">
              <h1
                id="product-heading"
                className="font-heading text-3xl font-semibold tracking-tight"
              >
                {product.name}
              </h1>
              <a href="#reviews" className="self-start rounded-sm">
                <Rating rating={product.rating} />
              </a>
              <PriceTag {...price} className="text-xl" />
            </div>
            <p className="leading-relaxed text-muted-foreground">{product.description}</p>
            {/* Keyed so quantity and errors don't carry over to another product */}
            <ProductPurchase key={product.id} product={product} selection={selection} />
            <section aria-labelledby="details-heading" className="flex flex-col gap-2">
              <h2 id="details-heading" className="text-sm font-medium">
                Details
              </h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {product.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </div>

      <ProductReviews product={product} />
      <RelatedProducts slug={product.slug} />
    </div>
  )
}
