import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ProductSummary } from '@/lib/schemas/catalog'
import { renderRoute } from '@/test/render'
import { ProductCard } from './ProductCard'

const baseProduct: ProductSummary = {
  id: 'prod_test',
  slug: 'linen-throw-blanket',
  name: 'Linen Throw Blanket',
  categorySlug: 'textiles',
  imageUrl: 'https://picsum.photos/seed/test/800/1000',
  imageAlt: 'Linen throw blanket in sage',
  priceCents: 8900,
  compareAtPriceCents: null,
  hasPriceRange: false,
  colors: [{ name: 'Sage', hex: '#9caf88' }],
  rating: { average: 4.6, count: 128 },
  inStock: true,
}

function renderCard(overrides: Partial<ProductSummary> = {}) {
  return renderRoute('/', [
    { path: '/', Component: () => <ProductCard product={{ ...baseProduct, ...overrides }} /> },
  ])
}

describe('ProductCard', () => {
  it('links the product name to its page', async () => {
    renderCard()

    expect(await screen.findByRole('link', { name: 'Linen Throw Blanket' })).toHaveAttribute(
      'href',
      '/p/linen-throw-blanket',
    )
  })

  it('describes the rating for screen readers', async () => {
    renderCard()

    expect(await screen.findByText('Rated 4.6 out of 5 from 128 reviews')).toBeInTheDocument()
  })

  it('says when there are no reviews', async () => {
    renderCard({ rating: { average: 0, count: 0 } })

    expect(await screen.findByText('No reviews yet')).toBeInTheDocument()
  })

  it('shows sale pricing with the original price', async () => {
    renderCard({ compareAtPriceCents: 10900 })

    expect(await screen.findByText('Sale')).toBeInTheDocument()
    expect(screen.getByText('$89')).toBeInTheDocument()
    expect(screen.getByText('$109').closest('s')).toHaveTextContent('Was $109')
  })

  it('prefixes "From" when variants have different prices', async () => {
    renderCard({ hasPriceRange: true })

    expect(await screen.findByText('From $89')).toBeInTheDocument()
  })

  it('marks sold-out products and hides the sale badge', async () => {
    renderCard({ inStock: false, compareAtPriceCents: 10900 })

    expect(await screen.findByText('Sold out')).toBeInTheDocument()
    expect(screen.queryByText('Sale')).not.toBeInTheDocument()
  })

  it('lists colors only when there is a choice', async () => {
    renderCard({
      colors: [
        { name: 'Sage', hex: '#9caf88' },
        { name: 'Oat', hex: '#d8cbb3' },
      ],
    })

    expect(await screen.findByRole('list', { name: '2 colors' })).toHaveTextContent('SageOat')
  })
})
