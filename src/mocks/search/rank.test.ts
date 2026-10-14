import { describe, expect, it } from 'vitest'
import { rankProducts, searchTerms, type SearchableProduct } from './rank'

const products: SearchableProduct[] = [
  {
    id: 'board',
    name: 'Walnut Prep Board with Scrap Drawer',
    categoryName: 'Kitchen',
    description: 'For chopping vegetables, then sweeping peels into the drawer.',
  },
  {
    id: 'caddy',
    name: 'Stoneware Compost Caddy',
    categoryName: 'Kitchen',
    description: 'For collecting peels and food scraps on the counter.',
  },
  {
    id: 'kettle',
    name: 'Copper Kettle',
    categoryName: 'Kitchen',
    description: 'For boiling water for tea.',
  },
  {
    id: 'lamp',
    name: 'Linen Floor Lamp',
    categoryName: 'Lighting',
    description: 'For lighting a reading chair.',
  },
]

// Unit vectors on separate axes keep the expected similarities easy to read
const productVectors = {
  board: [1, 0, 0, 0],
  caddy: [0.8, 0.6, 0, 0],
  kettle: [0, 0, 1, 0],
  lamp: [0, 0, 0, 1],
}

function rank(query: string, queryVector: number[] | null) {
  const semantic = queryVector && { queryVector, productVectors }
  return [...rankProducts(products, query, semantic)]
    .toSorted(([, a], [, b]) => b - a)
    .map(([id]) => id)
}

describe('searchTerms', () => {
  it('drops filler words and plurals', () => {
    expect(searchTerms('I need something to chop my vegetables, and dishes')).toEqual([
      'chop',
      'vegetable',
      'dish',
    ])
  })
})

describe('rankProducts with the model', () => {
  it('orders by similarity and drops products far below the best match', () => {
    expect(rank('somewhere for scraps', [0.95, 0.31, 0, 0])).toEqual(['board', 'caddy'])
  })

  it('finds nothing when even the best match is weak', () => {
    expect(rank('qwzx', [0.5, 0, 0.5, 0.5])).toEqual([])
  })

  it('lets a name match outrank a slightly closer meaning', () => {
    expect(rank('compost', [0.97, 0.24, 0, 0])).toEqual(['caddy', 'board'])
  })

  it('always keeps products named for every query term', () => {
    expect(rank('linen', [0, 0, 1, 0.3])).toEqual(['kettle', 'lamp'])
  })
})

describe('rankProducts without the model', () => {
  it('ranks by the share of query terms each product mentions', () => {
    expect(rank('peels and food scraps', null)).toEqual(['caddy', 'board'])
  })

  it('drops products far below the best keyword match', () => {
    expect(rank('kitchen peels', null)).toEqual(['board', 'caddy'])
  })

  it('finds nothing when no term matches', () => {
    expect(rank('qwzx', null)).toEqual([])
  })
})
