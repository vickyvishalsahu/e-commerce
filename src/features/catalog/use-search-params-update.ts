import { useLocation, useNavigation, useSearchParams, type NavigateOptions } from 'react-router'

/**
 * Like setSearchParams with an updater, but changes build on a navigation that is still loading.
 * React Router hands updaters the last rendered URL, so a second change made while the first
 * one's loader runs would silently drop the first. `flushSync` commits the pending navigation
 * before the event handler returns; by default the router applies it in a transition, which can
 * render after the next click.
 */
export function useSearchParamsUpdate() {
  const [, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigation = useNavigation()

  return (update: (current: URLSearchParams) => URLSearchParams, options?: NavigateOptions) => {
    const pending = navigation.location
    const base =
      pending && pending.pathname === location.pathname ? pending.search : location.search
    setSearchParams(update(new URLSearchParams(base)), { ...options, flushSync: true })
  }
}
