import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cartKeys, cartQueryOptions, useAddToCart } from '@/features/cart/api'
import { ApiError } from '@/lib/http'
import type { Product } from '@/lib/schemas/catalog'
import { catalogKeys } from '../api'
import {
  findSelectedVariant,
  LOW_STOCK_THRESHOLD,
  updateVariantParams,
  variantLabel,
  type VariantSelection,
} from '../variant-selection'
import { useSearchParamsUpdate } from '../use-search-params-update'
import { VariantPicker } from './VariantPicker'

/** The quantity menu stays short; larger orders can be adjusted in the cart */
const MAX_QUANTITY_OPTIONS = 10

function stockMessage(stock: number) {
  if (stock === 0) return 'Sold out'
  if (stock <= LOW_STOCK_THRESHOLD) return `Only ${stock} left`
  return 'In stock'
}

function errorMessage(error: Error) {
  return error instanceof ApiError
    ? error.message
    : "We couldn't add this to your cart. Check your connection and try again."
}

interface ProductPurchaseProps {
  product: Product
  selection: VariantSelection
}

export function ProductPurchase({ product, selection }: ProductPurchaseProps) {
  const updateSearchParams = useSearchParamsUpdate()
  const queryClient = useQueryClient()
  const { data: cart } = useQuery(cartQueryOptions())
  const addToCart = useAddToCart()
  const [quantity, setQuantity] = useState(1)
  const [sizeError, setSizeError] = useState<string>()
  const sizeInputRef = useRef<HTMLInputElement>(null)

  const variant = findSelectedVariant(product, selection)
  const inCart = cart?.items.find((item) => item.variantId === variant?.id)?.quantity ?? 0
  const available = variant ? Math.max(variant.stock - inCart, 0) : 0
  const maxQuantity = Math.min(available, MAX_QUANTITY_OPTIONS)
  const selectedQuantity = Math.min(quantity, Math.max(maxQuantity, 1))

  function select(changes: Partial<VariantSelection>) {
    setSizeError(undefined)
    addToCart.reset()
    // Replace rather than push: Back should leave the product, not step through swatches
    updateSearchParams((current) => updateVariantParams(current, changes), {
      replace: true,
      preventScrollReset: true,
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!variant) {
      setSizeError('Choose a size')
      sizeInputRef.current?.focus()
      return
    }
    addToCart.mutate(
      { variantId: variant.id, quantity: selectedQuantity },
      {
        onSuccess: () => {
          setQuantity(1)
          toast.success('Added to cart', {
            description: [product.name, variantLabel(variant)].filter(Boolean).join(' · '),
          })
        },
        onError: (error) => {
          // Stock moved since the page loaded: refresh it so the form shows what's left
          if (error instanceof ApiError && error.code === 'insufficient_stock') {
            void queryClient.invalidateQueries({ queryKey: catalogKeys.product(product.slug) })
            void queryClient.invalidateQueries({ queryKey: cartKeys.all })
          }
        },
      },
    )
  }

  function renderStatus() {
    if (!variant) return null
    if (variant.stock > 0 && available === 0) {
      return `All ${variant.stock} available are in your cart`
    }
    return stockMessage(variant.stock)
  }

  const soldOut = variant !== undefined && variant.stock === 0
  const cartFull = variant !== undefined && variant.stock > 0 && available === 0

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <VariantPicker
        product={product}
        selection={selection}
        onSelect={select}
        sizeError={sizeError}
        sizeInputRef={sizeInputRef}
      />

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {renderStatus()}
      </p>

      <div className="flex items-end gap-3">
        {!soldOut && !cartFull && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${product.id}-quantity`} className="text-sm">
              Quantity
            </label>
            <NativeSelect
              id={`${product.id}-quantity`}
              value={selectedQuantity}
              disabled={!variant}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {Array.from({ length: Math.max(maxQuantity, 1) }, (_, index) => (
                <NativeSelectOption key={index + 1} value={index + 1}>
                  {index + 1}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={soldOut || cartFull || addToCart.isPending}
        >
          {soldOut ? 'Sold out' : addToCart.isPending ? 'Adding…' : 'Add to cart'}
        </Button>
      </div>

      {addToCart.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(addToCart.error)}
        </p>
      )}
    </form>
  )
}
