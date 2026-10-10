import { MAX_LINE_QUANTITY, type Cart, type CartItem } from '@/lib/schemas/cart'
import { findVariant, variantImage, variantLabel } from './catalog'
import { createId, db, persist, type StoredCart } from './db'
import { getSessionUserId } from './responses'

export const CART_ID_HEADER = 'X-Cart-Id'

function createCart(userId: string | null): StoredCart {
  const cart: StoredCart = { id: createId('cart'), userId, items: [] }
  db().carts.push(cart)
  persist()
  return cart
}

export function findUserCart(userId: string) {
  return db().carts.find((cart) => cart.userId === userId)
}

/** Signed-in shoppers get their own cart; guests are identified by the X-Cart-Id header. */
export function resolveCart(request: Request): StoredCart {
  const userId = getSessionUserId(request)
  if (userId) return findUserCart(userId) ?? createCart(userId)

  const cartId = request.headers.get(CART_ID_HEADER)
  const guestCart = db().carts.find((cart) => cart.id === cartId && cart.userId === null)
  return guestCart ?? createCart(null)
}

export function toCartResponse(cart: StoredCart): Cart {
  const items = cart.items.flatMap((item): CartItem[] => {
    const match = findVariant(item.variantId)
    if (!match) return []
    const { product, variant } = match
    return [
      {
        id: item.id,
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        imageUrl: variantImage(product, variant).url,
        variantLabel: variantLabel(variant),
        unitPriceCents: variant.priceCents,
        compareAtPriceCents: variant.compareAtPriceCents,
        quantity: item.quantity,
        stock: variant.stock,
      },
    ]
  })
  return { id: cart.id, items }
}

/** Moves guest cart lines into the user's cart, capping each line at available stock. */
export function mergeGuestCart(guestCartId: string, userId: string) {
  const { carts } = db()
  const guestCart = carts.find((cart) => cart.id === guestCartId && cart.userId === null)
  if (!guestCart) return

  const userCart = findUserCart(userId) ?? createCart(userId)
  for (const guestItem of guestCart.items) {
    const stock = findVariant(guestItem.variantId)?.variant.stock ?? 0
    const existing = userCart.items.find((item) => item.variantId === guestItem.variantId)
    const quantity = Math.min(
      (existing?.quantity ?? 0) + guestItem.quantity,
      stock,
      MAX_LINE_QUANTITY,
    )
    if (quantity === 0) continue
    if (existing) existing.quantity = quantity
    else userCart.items.push({ ...guestItem, quantity })
  }

  carts.splice(carts.indexOf(guestCart), 1)
  persist()
}
