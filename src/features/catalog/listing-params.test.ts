import { describe, expect, it } from 'vitest'
import {
  clearListingFilters,
  countActiveFilters,
  parseListingParams,
  toProductListQuery,
  updateListingParams,
} from './listing-params'

const parse = (query: string) => parseListingParams(new URLSearchParams(query))

describe('parseListingParams', () => {
  it('uses defaults for an empty URL', () => {
    expect(parse('')).toEqual({
      q: undefined,
      sort: 'featured',
      page: 1,
      min: undefined,
      max: undefined,
      rating: undefined,
      inStock: false,
    })
  })

  it('reads every supported param', () => {
    expect(parse('q=lamp&sort=price-asc&page=3&min=20&max=80&rating=4&inStock=true')).toEqual({
      q: 'lamp',
      sort: 'price-asc',
      page: 3,
      min: 20,
      max: 80,
      rating: 4,
      inStock: true,
    })
  })

  it('ranks searches by relevance unless another sort is chosen', () => {
    expect(parse('q=lamp').sort).toBe('relevance')
    expect(parse('q=lamp&sort=rating').sort).toBe('rating')
  })

  it('ignores a relevance sort when there is nothing to rank by', () => {
    expect(parse('sort=relevance').sort).toBe('featured')
  })

  it('drops invalid values instead of failing', () => {
    expect(parse('sort=cheapest&page=-2&min=abc&rating=9&inStock=yes')).toMatchObject({
      sort: 'featured',
      page: 1,
      min: undefined,
      rating: undefined,
      inStock: false,
    })
  })

  it('treats empty values as missing, not zero', () => {
    expect(parse('min=&max=&q=%20')).toMatchObject({ min: undefined, max: undefined, q: undefined })
  })

  it('swaps an inverted price range', () => {
    expect(parse('min=80&max=20')).toMatchObject({ min: 20, max: 80 })
  })
})

describe('toProductListQuery', () => {
  it('converts dollar prices to cents and adds the category', () => {
    const query = toProductListQuery(parse('min=20&max=80&inStock=true'), { category: 'kitchen' })

    expect(query).toMatchObject({
      category: 'kitchen',
      minPrice: 2000,
      maxPrice: 8000,
      inStock: true,
      pageSize: 24,
    })
  })

  it('leaves inStock off when unchecked so cache keys match the unfiltered query', () => {
    expect(toProductListQuery(parse(''), {}).inStock).toBeUndefined()
  })
})

describe('updateListingParams', () => {
  it('resets to page 1 when a filter changes', () => {
    const next = updateListingParams(new URLSearchParams('page=3&q=lamp'), { rating: 4 })

    expect(next.toString()).toBe('q=lamp&rating=4')
  })

  it('leaves the search default sort out of the URL and records featured', () => {
    expect(
      updateListingParams(new URLSearchParams('q=lamp&sort=rating'), {
        sort: 'relevance',
      }).toString(),
    ).toBe('q=lamp')
    expect(
      updateListingParams(new URLSearchParams('q=lamp'), { sort: 'featured' }).toString(),
    ).toBe('q=lamp&sort=featured')
  })

  it('keeps other params when changing the page', () => {
    const next = updateListingParams(new URLSearchParams('sort=rating'), { page: 2 })

    expect(next.toString()).toBe('sort=rating&page=2')
  })

  it('leaves defaults out of the URL', () => {
    const next = updateListingParams(new URLSearchParams('sort=rating&inStock=true&page=2'), {
      sort: 'featured',
      inStock: false,
      page: 1,
    })

    expect(next.toString()).toBe('')
  })

  it('clears filters but keeps the search and sort', () => {
    const next = clearListingFilters(
      new URLSearchParams('q=lamp&sort=rating&min=5&max=50&rating=3&inStock=true&page=2'),
    )

    expect(next.toString()).toBe('q=lamp&sort=rating')
  })
})

describe('countActiveFilters', () => {
  it('counts a price range as one filter', () => {
    expect(countActiveFilters(parse('min=5&max=50&rating=3&inStock=true'))).toBe(3)
    expect(countActiveFilters(parse('sort=rating&q=lamp'))).toBe(0)
  })
})
