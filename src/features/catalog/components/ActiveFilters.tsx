import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ListingParams } from '../listing-params'
import { countActiveFilters } from '../listing-params'
import { useListingNavigation } from '../use-listing-navigation'

function priceLabel(min: number | undefined, max: number | undefined) {
  if (min !== undefined && max !== undefined) return `$${min} – $${max}`
  if (min !== undefined) return `$${min} and up`
  return `Up to $${max}`
}

export function ActiveFilters({ params }: { params: ListingParams }) {
  const { update, clearFilters } = useListingNavigation()
  if (countActiveFilters(params) === 0) return null

  const chips = [
    (params.min !== undefined || params.max !== undefined) && {
      label: priceLabel(params.min, params.max),
      remove: () => update({ min: undefined, max: undefined }),
    },
    params.rating !== undefined && {
      label: `${params.rating} stars & up`,
      remove: () => update({ rating: undefined }),
    },
    params.inStock && { label: 'In stock', remove: () => update({ inStock: false }) },
  ].filter((chip) => chip !== false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label="Active filters" className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.label}>
            <Button
              variant="secondary"
              size="sm"
              onClick={chip.remove}
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label}
              <XIcon aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="link" size="sm" onClick={clearFilters}>
        Clear all
      </Button>
    </div>
  )
}
