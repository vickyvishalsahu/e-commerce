import type { Product, Variant } from '@/lib/schemas/catalog'

export interface VariantSelection {
  color: string | null
  size: string | null
}

export const LOW_STOCK_THRESHOLD = 5

export function isColorAvailable(product: Product, color: string | null) {
  return product.variants.some((v) => v.color === color && v.stock > 0)
}

/**
 * Reads color and size from the URL, dropping values the product doesn't offer.
 * Color falls back to the first one in stock so the gallery always has a color to show;
 * size only defaults when there is a single option, since picking one for the shopper hides a choice.
 */
export function parseVariantSelection(
  searchParams: URLSearchParams,
  product: Product,
): VariantSelection {
  const colorNames = product.colors.map((c) => c.name)
  const colorParam = searchParams.get('color')
  const sizeParam = searchParams.get('size')

  const color =
    colorParam !== null && colorNames.includes(colorParam)
      ? colorParam
      : (colorNames.find((name) => isColorAvailable(product, name)) ?? colorNames[0] ?? null)

  const size =
    sizeParam !== null && product.sizes.includes(sizeParam)
      ? sizeParam
      : product.sizes.length === 1
        ? (product.sizes[0] ?? null)
        : null

  return { color, size }
}

/** The variant the shopper has fully chosen, or undefined while a size is still missing. */
export function findSelectedVariant(product: Product, selection: VariantSelection) {
  if (product.sizes.length > 0 && selection.size === null) return undefined
  return product.variants.find((v) => v.color === selection.color && v.size === selection.size)
}

export function sizeStock(product: Product, color: string | null, size: string) {
  return product.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0
}

/** Price for the chosen variant, or the lowest price in the selected color before a size is chosen. */
export function selectionPrice(product: Product, selection: VariantSelection) {
  const selected = findSelectedVariant(product, selection)
  if (selected) {
    return {
      priceCents: selected.priceCents,
      compareAtPriceCents: selected.compareAtPriceCents,
      fromPrice: false,
    }
  }
  const candidates = product.variants.filter((v) => v.color === selection.color)
  const pool = candidates.length > 0 ? candidates : product.variants
  const cheapest = pool.reduce((min, v) => (v.priceCents < min.priceCents ? v : min))
  return {
    priceCents: cheapest.priceCents,
    compareAtPriceCents: cheapest.compareAtPriceCents,
    fromPrice: pool.some((v) => v.priceCents !== cheapest.priceCents),
  }
}

export function selectionImages(product: Product, color: string | null) {
  const matching = product.images.filter((image) => image.color === color)
  return matching.length > 0 ? matching : product.images
}

export function variantLabel(variant: Pick<Variant, 'color' | 'size'>) {
  return [variant.color, variant.size].filter((part) => part !== null).join(' · ')
}

export function updateVariantParams(current: URLSearchParams, changes: Partial<VariantSelection>) {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue
    if (value === null) next.delete(key)
    else next.set(key, value)
  }
  return next
}
