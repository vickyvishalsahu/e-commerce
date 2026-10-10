import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ProductListResponse } from '@/lib/schemas/catalog'
import type { ListingParams } from '../listing-params'
import { useListingNavigation } from '../use-listing-navigation'

const ratingOptions = [
  { value: 'any', label: 'Any rating' },
  { value: '4', label: '4 stars & up' },
  { value: '3', label: '3 stars & up' },
  { value: '2', label: '2 stars & up' },
]

interface ListingFiltersProps {
  params: ListingParams
  priceRange: ProductListResponse['priceRange']
  /** Distinguishes the ids of the sidebar and the mobile sheet copies */
  idPrefix: string
}

function readDollars(form: FormData, name: string) {
  const raw = form.get(name)
  if (typeof raw !== 'string' || raw.trim() === '') return undefined
  const value = Math.round(Number(raw))
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

export function ListingFilters({ params, priceRange, idPrefix }: ListingFiltersProps) {
  const { update } = useListingNavigation()

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    update({ min: readDollars(form, 'min'), max: readDollars(form, 'max') })
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={applyPrice}
        className="flex flex-col gap-3"
        aria-labelledby={`${idPrefix}-price`}
      >
        <h2 id={`${idPrefix}-price`} className="text-sm font-medium">
          Price
        </h2>
        {/* Remount when the URL changes so the fields always show the applied range */}
        <div key={`${params.min}-${params.max}`} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-min`} className="text-xs text-muted-foreground">
              Min ($)
            </Label>
            <Input
              id={`${idPrefix}-min`}
              name="min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={String(Math.floor(priceRange.minCents / 100))}
              defaultValue={params.min}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-max`} className="text-xs text-muted-foreground">
              Max ($)
            </Label>
            <Input
              id={`${idPrefix}-max`}
              name="max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={String(Math.ceil(priceRange.maxCents / 100))}
              defaultValue={params.max}
            />
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" className="self-start">
          Apply price
        </Button>
      </form>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Rating</legend>
        <RadioGroup
          value={params.rating === undefined ? 'any' : String(params.rating)}
          onValueChange={(value) => update({ rating: value === 'any' ? undefined : Number(value) })}
        >
          {ratingOptions.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`${idPrefix}-rating-${option.value}`} />
              <Label htmlFor={`${idPrefix}-rating-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Availability</legend>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${idPrefix}-in-stock`}
            checked={params.inStock}
            onCheckedChange={(checked) => update({ inStock: checked === true })}
          />
          <Label htmlFor={`${idPrefix}-in-stock`} className="font-normal">
            In stock only
          </Label>
        </div>
      </fieldset>
    </div>
  )
}
