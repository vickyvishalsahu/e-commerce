import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { productListResponseSchema } from '@/lib/schemas/catalog'
import { api } from '@/test/api'
import { renderRoute } from '@/test/render'

async function results() {
  const region = await screen.findByRole('region', { name: 'Results' })
  return within(region).queryAllByRole('article')
}

function cardName(card: HTMLElement) {
  return within(card).getByRole('link').textContent
}

async function apiNames(query: string) {
  const { json } = await api(`/api/products?${query}`)
  return productListResponseSchema.parse(json).items.map((item) => item.name)
}

describe('CategoryPage', () => {
  it('shows the category heading, product count and first page of products', async () => {
    renderRoute('/shop/kitchen')

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitchen' })).toBeInTheDocument()
    expect(screen.getByText('25 products')).toBeInTheDocument()
    expect(await results()).toHaveLength(24)
    expect(document.title).toBe('Kitchen · Storefront')
  })

  it('sorts by price and records the sort in the URL', async () => {
    const { router, user } = renderRoute('/shop/kitchen')
    await screen.findByRole('heading', { name: 'Kitchen' })

    await user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc')

    await waitFor(() => expect(router.state.location.search).toBe('?sort=price-asc'))
    const expected = await apiNames('category=kitchen&sort=price-asc')
    await waitFor(async () => expect((await results()).map(cardName)).toEqual(expected))
  })

  it('applies a price range in dollars and shows it as a removable filter', async () => {
    const { router, user } = renderRoute('/shop/kitchen')
    await screen.findByRole('heading', { name: 'Kitchen' })

    await user.type(screen.getByLabelText('Min ($)'), '50')
    await user.type(screen.getByLabelText('Max ($)'), '100')
    await user.click(screen.getByRole('button', { name: 'Apply price' }))

    await waitFor(() => expect(router.state.location.search).toBe('?min=50&max=100'))
    const chip = await screen.findByRole('button', { name: 'Remove filter: $50 – $100' })
    const expected = await apiNames('category=kitchen&minPrice=5000&maxPrice=10000')
    await waitFor(async () => expect((await results()).map(cardName)).toEqual(expected))

    await user.click(chip)
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })

  it('filters by rating and stock, and clears everything at once', async () => {
    const { router, user } = renderRoute('/shop/textiles')
    await screen.findByRole('heading', { name: 'Textiles' })

    await user.click(screen.getByRole('radio', { name: '4 stars & up' }))
    await waitFor(() => expect(router.state.location.search).toBe('?rating=4'))
    await user.click(screen.getByRole('checkbox', { name: 'In stock only' }))
    await waitFor(() => expect(router.state.location.search).toBe('?rating=4&inStock=true'))

    const expected = await apiNames('category=textiles&rating=4&inStock=true')
    await waitFor(async () => expect((await results()).map(cardName)).toEqual(expected))

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Any rating' })).toBeChecked())
  })

  it('offers to clear filters when nothing matches', async () => {
    const { router, user } = renderRoute('/shop/kitchen?min=100000')

    expect(await screen.findByText('No products match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() => expect(router.state.location.search).toBe(''))
    await waitFor(async () => expect(await results()).toHaveLength(24))
  })

  it('pages through results and moves focus to the heading', async () => {
    const { router, user } = renderRoute('/shop/kitchen?sort=rating')
    await screen.findByRole('heading', { name: 'Kitchen' })
    const pagination = screen.getByRole('navigation', { name: 'Pagination' })
    expect(within(pagination).getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(within(pagination).getByRole('link', { name: 'Next page' }))

    await waitFor(() => expect(router.state.location.search).toBe('?sort=rating&page=2'))
    await waitFor(async () => expect(await results()).toHaveLength(1))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  })

  it('explains when the page number is past the end', async () => {
    renderRoute('/shop/kitchen?page=7')

    expect(await screen.findByText("This page doesn't exist")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to page 1' })).toHaveAttribute(
      'href',
      '/shop/kitchen',
    )
  })

  it('ignores invalid URL params instead of failing', async () => {
    renderRoute('/shop/kitchen?sort=cheapest&page=abc&rating=99')

    expect(await results()).toHaveLength(24)
    expect(screen.getByLabelText('Sort by')).toHaveValue('featured')
    expect(screen.queryByRole('option', { name: 'Best match' })).not.toBeInTheDocument()
  })

  it('shows the not found page for an unknown category', async () => {
    renderRoute('/shop/garage')

    expect(
      await screen.findByRole('heading', { name: "We can't find that page" }),
    ).toBeInTheDocument()
  })
})
