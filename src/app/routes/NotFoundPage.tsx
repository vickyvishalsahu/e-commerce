import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-4 py-16">
      <title>Page not found · Storefront</title>
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        We can&apos;t find that page
      </h1>
      <p className="max-w-prose text-muted-foreground">
        The link may be broken, or the page may have moved. Try searching, or head back to the
        homepage.
      </p>
      <Button asChild>
        <Link to="/">Back to the homepage</Link>
      </Button>
    </section>
  )
}
