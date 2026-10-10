import { UserIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { CartLink } from '@/features/cart/components/CartLink'
import { CategoryNav } from '@/features/catalog/components/CategoryNav'
import { SearchForm } from '@/features/catalog/components/SearchForm'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 md:flex-nowrap">
          <Link to="/" className="rounded-sm font-heading text-xl font-semibold tracking-tight">
            Storefront
          </Link>
          <div className="order-last w-full md:order-none md:max-w-md md:flex-1">
            <SearchForm />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon-lg">
              <Link to="/account" aria-label="Account">
                <UserIcon aria-hidden className="size-5" />
              </Link>
            </Button>
            <CartLink />
          </div>
        </div>
        <CategoryNav />
      </div>
    </header>
  )
}
