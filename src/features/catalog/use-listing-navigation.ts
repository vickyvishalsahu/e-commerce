import { clearListingFilters, updateListingParams } from './listing-params'
import { useSearchParamsUpdate } from './use-search-params-update'

/** Applies listing changes as new history entries so Back undoes a filter, without jumping to the top. */
export function useListingNavigation() {
  const updateSearchParams = useSearchParamsUpdate()

  return {
    update: (changes: Parameters<typeof updateListingParams>[1]) =>
      updateSearchParams((current) => updateListingParams(current, changes), {
        preventScrollReset: true,
      }),
    clearFilters: () => updateSearchParams(clearListingFilters, { preventScrollReset: true }),
  }
}
