import { cn } from 'cn'
import type { Ref } from 'react'
import type { Product } from '@/lib/schemas/catalog'
import { isColorAvailable, sizeStock, type VariantSelection } from '../variant-selection'

interface VariantPickerProps {
  product: Product
  selection: VariantSelection
  onSelect: (changes: Partial<VariantSelection>) => void
  sizeError?: string
  /** Receives the first size option so a missing size can move focus there */
  sizeInputRef?: Ref<HTMLInputElement>
}

const optionClassName =
  'outline-none has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background'

export function VariantPicker({
  product,
  selection,
  onSelect,
  sizeError,
  sizeInputRef,
}: VariantPickerProps) {
  const sizeErrorId = `${product.id}-size-error`

  return (
    <div className="flex flex-col gap-5">
      {product.colors.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm">
            Color: <span className="font-medium">{selection.color}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const available = isColorAvailable(product, color.name)
              return (
                <label
                  key={color.name}
                  title={available ? color.name : `${color.name}, sold out`}
                  className={cn(
                    optionClassName,
                    'relative flex size-9 cursor-pointer items-center justify-center rounded-full ring-1 ring-border has-checked:ring-2 has-checked:ring-foreground has-checked:ring-offset-2 has-checked:ring-offset-background',
                  )}
                >
                  <input
                    type="radio"
                    name="color"
                    value={color.name}
                    checked={selection.color === color.name}
                    onChange={() => onSelect({ color: color.name })}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className="size-7 rounded-full ring-1 ring-black/10 ring-inset"
                    style={{ backgroundColor: color.hex }}
                  />
                  {!available && (
                    <span aria-hidden className="absolute h-px w-9 -rotate-45 bg-foreground/70" />
                  )}
                  <span className="sr-only">
                    {color.name}
                    {!available && ', sold out'}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ) : (
        selection.color && (
          <p className="text-sm">
            Color: <span className="font-medium">{selection.color}</span>
          </p>
        )
      )}

      {product.sizes.length > 1 && (
        <fieldset
          aria-describedby={sizeError ? sizeErrorId : undefined}
          className="flex flex-col gap-2"
        >
          <legend className="mb-2 text-sm">
            Size
            {selection.size && (
              <>
                : <span className="font-medium">{selection.size}</span>
              </>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size, index) => {
              const available = sizeStock(product, selection.color, size) > 0
              return (
                <label
                  key={size}
                  className={cn(
                    optionClassName,
                    'flex h-9 min-w-12 cursor-pointer items-center justify-center rounded-md border px-3 text-sm has-checked:border-foreground has-checked:bg-foreground has-checked:text-background',
                    !available && 'text-muted-foreground line-through',
                    sizeError && 'border-destructive',
                  )}
                >
                  <input
                    ref={index === 0 ? sizeInputRef : undefined}
                    type="radio"
                    name="size"
                    value={size}
                    checked={selection.size === size}
                    onChange={() => onSelect({ size })}
                    className="sr-only"
                  />
                  {size}
                  {!available && <span className="sr-only">, sold out</span>}
                </label>
              )
            })}
          </div>
          {sizeError && (
            <p id={sizeErrorId} className="text-sm text-destructive">
              {sizeError}
            </p>
          )}
        </fieldset>
      )}
      {product.sizes.length === 1 && (
        <p className="text-sm">
          Size: <span className="font-medium">{product.sizes[0]}</span>
        </p>
      )}
    </div>
  )
}
