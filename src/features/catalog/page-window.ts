/** Page numbers to show, with null standing in for a gap: 1 … 4 5 6 … 9 */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).toSorted((a, b) => a - b)
  return sorted.flatMap((p, index) => {
    const previous = sorted[index - 1]
    return previous !== undefined && p - previous > 1 ? [null, p] : [p]
  })
}
