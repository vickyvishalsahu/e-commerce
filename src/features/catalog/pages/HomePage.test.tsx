import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/render'

describe('HomePage', () => {
  it('shows category tiles and featured products', async () => {
    renderRoute('/')

    expect(await screen.findByRole('heading', { name: 'Featured' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kitchen\s*25 products/ })).toHaveAttribute(
      'href',
      '/shop/kitchen',
    )
  })
})
