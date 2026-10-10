import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { db } from '@/mocks/db'
import { server } from '@/mocks/node'
import { renderRoute } from '@/test/render'

// Cast Iron Dutch Oven: Sage and Cobalt in 3.5, 5.5 and 7.25 qt, $96 / $110 / $124, 7 reviews
const PRODUCT_PATH = '/p/cast-iron-dutch-oven'
const SAGE_SMALL = 'prod_1_v11'
const COBALT_MEDIUM = 'prod_1_v22'

async function renderProduct(path = PRODUCT_PATH) {
  const rendered = renderRoute(path)
  await screen.findByRole('heading', { level: 1, name: 'Cast Iron Dutch Oven' })
  return rendered
}

/** The product block, excluding related product cards that show prices too */
function product() {
  return within(screen.getByRole('article', { name: 'Cast Iron Dutch Oven' }))
}

function addButton() {
  return screen.getByRole('button', { name: /Add to cart|Adding|Sold out/ })
}

describe('ProductPage', () => {
  it('shows the product with breadcrumbs, a from price, reviews and related products', async () => {
    await renderProduct()

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Kitchen' })).toHaveAttribute(
      'href',
      '/shop/kitchen',
    )
    expect(document.title).toBe('Cast Iron Dutch Oven · Storefront')
    expect(product().getByText('From $96')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Sage' })).toBeChecked()
    expect(await screen.findByText('Showing 5 of 7')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'You may also like' })).toBeInTheDocument()
  })

  it('updates price and stock for the chosen variant and keeps it in the URL', async () => {
    const { router, user } = await renderProduct()

    await user.click(screen.getByRole('radio', { name: 'Cobalt' }))
    await user.click(screen.getByRole('radio', { name: '5.5 qt' }))

    expect(await product().findByText('$110')).toBeInTheDocument()
    expect(product().queryByText(/^From/)).not.toBeInTheDocument()
    expect(screen.getByText('In stock')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?color=Cobalt&size=5.5+qt')
    // Back should leave the product, not step through swatches
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('restores the selection from the URL and ignores values the product lacks', async () => {
    await renderProduct(`${PRODUCT_PATH}?color=Cobalt&size=7.25+qt`)
    expect(screen.getByRole('radio', { name: 'Cobalt' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '7.25 qt' })).toBeChecked()
    expect(product().getByText('$124')).toBeInTheDocument()
  })

  it('falls back to defaults for unknown variant values', async () => {
    await renderProduct(`${PRODUCT_PATH}?color=Pink&size=huge`)
    expect(screen.getByRole('radio', { name: 'Sage' })).toBeChecked()
    expect(product().getByText('From $96')).toBeInTheDocument()
  })

  it('asks for a size before adding and moves focus to the size options', async () => {
    const { user } = await renderProduct()

    await user.click(addButton())

    expect(screen.getByText('Choose a size')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '3.5 qt' })).toHaveFocus()
    expect(screen.getByRole('group', { name: 'Size' })).toHaveAccessibleDescription('Choose a size')
  })

  it('adds the chosen variant and quantity to the cart', async () => {
    const { user } = await renderProduct()

    await user.click(screen.getByRole('radio', { name: 'Cobalt' }))
    await user.click(screen.getByRole('radio', { name: '5.5 qt' }))
    await waitFor(() => expect(screen.getByLabelText('Quantity')).toBeEnabled())
    await user.selectOptions(screen.getByLabelText('Quantity'), '2')
    await user.click(addButton())

    expect(await screen.findByText('Added to cart')).toBeInTheDocument()
    expect(screen.getByText('Cast Iron Dutch Oven · Cobalt · 5.5 qt')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument()
  })

  it('shows sold out variants and blocks adding them', async () => {
    db().stock[SAGE_SMALL] = 0
    const { user } = await renderProduct()

    expect(screen.getByRole('radio', { name: '3.5 qt, sold out' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '3.5 qt, sold out' }))

    expect(await screen.findByRole('button', { name: 'Sold out' })).toBeDisabled()
    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument()
  })

  it('marks a color sold out when none of its sizes are left', async () => {
    for (const id of ['prod_1_v11', 'prod_1_v12', 'prod_1_v13']) db().stock[id] = 0
    await renderProduct()

    // The default moves to the first color still in stock
    expect(screen.getByRole('radio', { name: 'Cobalt' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Sage, sold out' })).toBeInTheDocument()
  })

  it('warns about low stock and limits quantity to what is left', async () => {
    db().stock[COBALT_MEDIUM] = 3
    const { user } = await renderProduct(`${PRODUCT_PATH}?color=Cobalt&size=5.5+qt`)

    expect(screen.getByText('Only 3 left')).toBeInTheDocument()
    const options = within(screen.getByLabelText('Quantity')).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['1', '2', '3'])

    await user.selectOptions(screen.getByLabelText('Quantity'), '3')
    await user.click(addButton())

    expect(await screen.findByText('All 3 available are in your cart')).toBeInTheDocument()
    expect(addButton()).toBeDisabled()
  })

  it('explains and refreshes stock when it ran out after the page loaded', async () => {
    const { user } = await renderProduct(`${PRODUCT_PATH}?color=Cobalt&size=5.5+qt`)
    await user.selectOptions(screen.getByLabelText('Quantity'), '4')

    db().stock[COBALT_MEDIUM] = 1
    await user.click(addButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Only 1 left in stock')
    expect(await screen.findByText('Only 1 left')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toHaveValue('1')
  })

  it('shows a retryable message when adding fails for another reason', async () => {
    server.use(http.post('/api/cart/items', () => HttpResponse.error()))
    const { user } = await renderProduct(`${PRODUCT_PATH}?color=Cobalt&size=5.5+qt`)

    await user.click(addButton())

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't add this to your cart")
    expect(addButton()).toBeEnabled()
  })

  it('switches gallery images and starts over when the color changes', async () => {
    const { user } = await renderProduct()
    const gallery = screen.getByRole('list', { name: 'Product images' })

    await user.click(within(gallery).getByRole('button', { name: 'Show image 2 of 3' }))
    expect(screen.getByRole('img', { name: 'Cast Iron Dutch Oven in sage, view 2' })).toBeVisible()

    await user.click(screen.getByRole('radio', { name: 'Cobalt' }))
    expect(
      await screen.findByRole('img', { name: 'Cast Iron Dutch Oven in cobalt, view 1' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show image 1 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('loads more reviews on request', async () => {
    const { user } = await renderProduct()

    await user.click(await screen.findByRole('button', { name: 'Show more reviews' }))

    expect(await screen.findByText('Showing 7 of 7')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show more reviews' })).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Rating breakdown' })).toHaveTextContent(
      '5 stars: 3 reviews',
    )
  })

  it('keeps the page usable when reviews and related products fail', async () => {
    server.use(
      http.get('/api/products/:slug/reviews', () => HttpResponse.json(null, { status: 500 })),
      http.get('/api/products/:slug/related', () => HttpResponse.json(null, { status: 500 })),
    )
    const { user } = await renderProduct()

    expect(await screen.findByText("Reviews couldn't load.")).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You may also like' })).not.toBeInTheDocument()
    expect(addButton()).toBeEnabled()

    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Showing 5 of 7')).toBeInTheDocument()
  })

  it('shows the not found page for an unknown product', async () => {
    renderRoute('/p/no-such-product')
    expect(
      await screen.findByRole('heading', { name: "We can't find that page" }),
    ).toBeInTheDocument()
  })

  it('opens a product from a listing card', async () => {
    const { user } = renderRoute('/shop/kitchen')
    await user.click(await screen.findByRole('link', { name: 'Cast Iron Dutch Oven' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Cast Iron Dutch Oven' }),
      ).toBeInTheDocument(),
    )
  })
})
