import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import type { ProductSummary } from '@/lib/schemas/catalog'
import { productQueryOptions } from '../api'
import { PriceTag } from './PriceTag'
import { Rating } from './Rating'

export function ProductCard({ product }: { product: ProductSummary }) {
  const queryClient = useQueryClient()
  const prefetch = () => void queryClient.prefetchQuery(productQueryOptions(product.slug))
  const onSale =
    product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-muted">
        <img
          src={product.imageUrl}
          // The product name link describes the card; the photo adds nothing for screen readers
          alt=""
          loading="lazy"
          width={800}
          height={1000}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
        {!product.inStock && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Sold out
          </Badge>
        )}
        {product.inStock && onSale && (
          <Badge variant="destructive" className="absolute top-3 left-3">
            Sale
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">
          <Link
            to={`/p/${product.slug}`}
            onMouseEnter={prefetch}
            onFocus={prefetch}
            // Stretch the link over the whole card so the image is clickable too
            className="rounded-sm after:absolute after:inset-0 after:rounded-lg"
          >
            {product.name}
          </Link>
        </h3>
        <Rating rating={product.rating} />
        <PriceTag
          priceCents={product.priceCents}
          compareAtPriceCents={product.compareAtPriceCents}
          fromPrice={product.hasPriceRange}
          className="text-sm"
        />
        {product.colors.length > 1 && (
          <ul aria-label={`${product.colors.length} colors`} className="flex gap-1.5 pt-1">
            {product.colors.map((color) => (
              <li key={color.name}>
                <span
                  title={color.name}
                  className="block size-3 rounded-full ring-1 ring-black/10 ring-inset"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="sr-only">{color.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
