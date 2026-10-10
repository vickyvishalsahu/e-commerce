import { cn } from 'cn'
import { formatPrice } from '@/lib/format'

interface PriceTagProps {
  priceCents: number
  compareAtPriceCents: number | null
  fromPrice?: boolean
  className?: string
}

export function PriceTag({ priceCents, compareAtPriceCents, fromPrice, className }: PriceTagProps) {
  const onSale = compareAtPriceCents !== null && compareAtPriceCents > priceCents

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 tabular-nums', className)}>
      <span className={cn('font-medium', onSale && 'text-destructive')}>
        {fromPrice && 'From '}
        {formatPrice(priceCents)}
      </span>
      {onSale && (
        <s className="text-muted-foreground">
          <span className="sr-only">Was </span>
          {formatPrice(compareAtPriceCents)}
        </s>
      )}
    </p>
  )
}
