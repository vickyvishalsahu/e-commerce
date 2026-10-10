import { cn } from 'cn'
import { useState } from 'react'
import type { ProductImage } from '@/lib/schemas/catalog'

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? images[0]

  return (
    // Thumbnails sit beside the photo on wide screens so they stay above the fold
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div className="aspect-4/5 overflow-hidden rounded-lg bg-muted lg:flex-1">
        {active && (
          <img
            src={active.url}
            alt={active.alt}
            width={800}
            height={1000}
            fetchPriority="high"
            className="size-full object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <ul aria-label="Product images" className="flex gap-3 lg:flex-col">
          {images.map((image, index) => (
            <li key={image.url} className="w-20 shrink-0">
              <button
                type="button"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'block aspect-4/5 w-full overflow-hidden rounded-md bg-muted ring-offset-2 ring-offset-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  index === activeIndex ? 'ring-2 ring-foreground' : 'opacity-70 hover:opacity-100',
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  width={160}
                  height={200}
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
