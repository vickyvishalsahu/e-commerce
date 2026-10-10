import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router'
import { cn } from 'cn'
import { Skeleton } from '@/components/ui/skeleton'
import { categoriesQueryOptions } from '../api'

const SKELETON_COUNT = 8

export function CategoryNav() {
  const { data: categories, isPending, isError } = useQuery(categoriesQueryOptions())

  // Navigation is a convenience; pages report their own errors, so the header stays usable
  if (isError) return null

  return (
    <nav aria-label="Categories">
      <ul className="-mx-4 flex gap-6 overflow-x-auto px-4 py-3 text-sm whitespace-nowrap sm:mx-0 sm:px-0">
        {isPending
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={index} aria-hidden>
                <Skeleton className="h-5 w-16" />
              </li>
            ))
          : categories.map((category) => (
              <li key={category.id}>
                <NavLink
                  to={`/shop/${category.slug}`}
                  className={({ isActive }) =>
                    cn(
                      'rounded-sm text-muted-foreground transition-colors hover:text-foreground',
                      isActive && 'font-medium text-foreground',
                    )
                  }
                >
                  {category.name}
                </NavLink>
              </li>
            ))}
      </ul>
    </nav>
  )
}
