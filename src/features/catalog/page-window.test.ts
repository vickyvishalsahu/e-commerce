import { describe, expect, it } from 'vitest'
import { pageWindow } from './page-window'

describe('pageWindow', () => {
  it('shows every page when there are only a few', () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3])
  })

  it('collapses gaps on both sides of the current page', () => {
    expect(pageWindow(5, 9)).toEqual([1, null, 4, 5, 6, null, 9])
  })

  it('does not insert a gap between consecutive pages', () => {
    expect(pageWindow(3, 9)).toEqual([1, 2, 3, 4, null, 9])
  })

  it('handles the first and last pages', () => {
    expect(pageWindow(1, 9)).toEqual([1, 2, null, 9])
    expect(pageWindow(9, 9)).toEqual([1, null, 8, 9])
  })

  it('handles a single page', () => {
    expect(pageWindow(1, 1)).toEqual([1])
  })
})
