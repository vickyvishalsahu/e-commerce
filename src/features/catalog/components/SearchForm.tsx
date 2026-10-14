import { SearchIcon } from 'lucide-react'
import { Form, useLocation, useSearchParams } from 'react-router'
import { Input } from '@/components/ui/input'

export function SearchForm() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const currentQuery = pathname === '/search' ? (searchParams.get('q') ?? '') : ''

  return (
    <search>
      <Form action="/search" className="relative">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          // Remount when the URL query changes so back/forward updates the field
          key={currentQuery}
          id="site-search"
          type="search"
          name="q"
          defaultValue={currentQuery}
          placeholder="Search or describe what you need"
          required
          className="pl-9"
        />
      </Form>
    </search>
  )
}
