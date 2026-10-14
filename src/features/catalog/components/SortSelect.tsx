import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { productSortSchema, type ProductSort } from '@/lib/schemas/catalog'
import { useListingNavigation } from '../use-listing-navigation'

const sortLabels: Record<ProductSort, string> = {
  relevance: 'Best match',
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
}

/** `searching` offers Best match, which only means something when there's a query to match */
export function SortSelect({ sort, searching }: { sort: ProductSort; searching: boolean }) {
  const options = productSortSchema.options.filter((option) => searching || option !== 'relevance')

  const { update } = useListingNavigation()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="listing-sort" className="text-sm whitespace-nowrap text-muted-foreground">
        Sort by
      </label>
      <NativeSelect
        id="listing-sort"
        value={sort}
        onChange={(event) => {
          const parsed = productSortSchema.safeParse(event.target.value)
          if (parsed.success) update({ sort: parsed.data })
        }}
      >
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {sortLabels[option]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
