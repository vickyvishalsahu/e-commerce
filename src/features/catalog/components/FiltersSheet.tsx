import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ProductListResponse } from '@/lib/schemas/catalog'
import { countActiveFilters, type ListingParams } from '../listing-params'
import { ListingFilters } from './ListingFilters'

interface FiltersSheetProps {
  params: ListingParams
  priceRange: ProductListResponse['priceRange']
  total: number
}

export function FiltersSheet({ params, priceRange, total }: FiltersSheetProps) {
  const activeCount = countActiveFilters(params)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontalIcon aria-hidden />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Results update as you choose.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4">
          <ListingFilters params={params} priceRange={priceRange} idPrefix="sheet" />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>
              Show {total} {total === 1 ? 'product' : 'products'}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
