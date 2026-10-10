import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { cartSchema } from '@/lib/schemas/cart'
import { setGuestCartId } from '@/lib/session'
import { catalog } from '@/mocks/db'
import { server } from '@/mocks/node'
import { api } from '@/test/api'
import { renderRoute } from '@/test/render'

async function guestCartWithQuantity(quantity: number) {
  const cart = cartSchema.parse((await api('/api/cart')).json)
  const variant = catalog.products.flatMap((p) => p.variants).find((v) => v.stock >= quantity)
  await api('/api/cart/items', {
    method: 'POST',
    cartId: cart.id,
    body: { variantId: variant?.id, quantity },
  })
  setGuestCartId(cart.id)
}

describe('site header', () => {
  it('links to every category', async () => {
    renderRoute('/')

    const nav = screen.getByRole('navigation', { name: 'Categories' })
    const links = await within(nav).findAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual(catalog.categories.map((c) => c.name))
    expect(within(nav).getByRole('link', { name: 'Kitchen' })).toHaveAttribute(
      'href',
      '/shop/kitchen',
    )
  })

  it('keeps the header usable when categories fail to load', async () => {
    server.use(http.get('/api/categories', () => HttpResponse.json(null, { status: 500 })))
    renderRoute('/')

    await waitFor(() => {
      expect(screen.queryByRole('navigation', { name: 'Categories' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows how many items are in the cart', async () => {
    await guestCartWithQuantity(3)
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Cart, 3 items' })).toHaveAttribute(
      'href',
      '/cart',
    )
  })

  it('uses the singular for one item', async () => {
    await guestCartWithQuantity(1)
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument()
  })

  it('creates and remembers a guest cart on first visit', async () => {
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Cart, 0 items' })).toBeInTheDocument()
    expect(localStorage.getItem('storefront:guest-cart-id')).toMatch(/^cart_/)
  })

  it('submits the search to the search page', async () => {
    const { router, user } = renderRoute('/')

    await user.type(
      screen.getByRole('searchbox', { name: 'Search products' }),
      'linen throw{Enter}',
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/search')
    })
    expect(router.state.location.search).toBe('?q=linen+throw')
  })

  it('lets keyboard users skip to the main content', () => {
    renderRoute('/')

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })
})

describe('not found', () => {
  it('shows the not found page inside the layout for unknown paths', async () => {
    renderRoute('/no-such-page')

    expect(
      await screen.findByRole('heading', { name: "We can't find that page" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the homepage' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toBeInTheDocument()
  })
})
