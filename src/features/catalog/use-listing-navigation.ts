import { useSearchParams } from 'react-router'
import { clearListingFilters, updateListingParams } from './listing-params'

/** Applies listing changes as new history entries so Back undoes a filter, without jumping to the top. */
export function useListingNavigation() {
  const [searchParams, setSearchParams] = useSearchParams()

  return {
    searchParams,
    update: (changes: Parameters<typeof updateListingParams>[1]) =>
      setSearchParams(updateListingParams(searchParams, changes), { preventScrollReset: true }),
    clearFilters: () =>
      setSearchParams(clearListingFilters(searchParams), { preventScrollReset: true }),
  }
}
