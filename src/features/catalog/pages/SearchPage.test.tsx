import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/render'

describe('SearchPage', () => {
  it('lists matching products with the query in the heading and search box', async () => {
    renderRoute('/search?q=dutch%20oven')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Results for “dutch oven”' }),
    ).toBeInTheDocument()
    const cards = within(screen.getByRole('region', { name: 'Results' })).getAllByRole('article')
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) expect(card).toHaveTextContent(/dutch oven/i)
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toHaveValue('dutch oven')
  })

  it('sorts by best match, an option only searches offer', async () => {
    const { router, user } = renderRoute('/search?q=linen')

    const sort = await screen.findByLabelText('Sort by')
    expect(sort).toHaveValue('relevance')

    await user.selectOptions(sort, 'featured')
    await waitFor(() => expect(router.state.location.search).toBe('?q=linen&sort=featured'))
    await user.selectOptions(screen.getByLabelText('Sort by'), 'relevance')
    await waitFor(() => expect(router.state.location.search).toBe('?q=linen'))
  })

  it('suggests categories and hides filters when nothing matches', async () => {
    renderRoute('/search?q=zzzz')

    expect(await screen.findByText('No results for “zzzz”')).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Lighting' }),
    ).toHaveAttribute('href', '/shop/lighting')
    expect(screen.queryByLabelText('Sort by')).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Filters' })).not.toBeInTheDocument()
  })

  it('prompts for a search when there is no query', async () => {
    renderRoute('/search')

    expect(await screen.findByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Results' })).not.toBeInTheDocument()
  })
})
