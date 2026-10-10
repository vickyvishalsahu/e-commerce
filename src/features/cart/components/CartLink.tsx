import { useQuery } from '@tanstack/react-query'
import { ShoppingBagIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cartQueryOptions } from '../api'

function cartLabel(itemCount: number | undefined) {
  if (itemCount === undefined) return 'Cart'
  return `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
}

export function CartLink() {
  const { data: cart } = useQuery(cartQueryOptions())
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Button asChild variant="ghost" size="icon-lg" className="relative">
      <Link to="/cart" aria-label={cartLabel(itemCount)}>
        <ShoppingBagIcon aria-hidden className="size-5" />
        {itemCount !== undefined && itemCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground tabular-nums"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Link>
    </Button>
  )
}
