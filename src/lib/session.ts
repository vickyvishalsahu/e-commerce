const GUEST_CART_KEY = 'storefront:guest-cart-id'

export function getGuestCartId() {
  try {
    return localStorage.getItem(GUEST_CART_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function setGuestCartId(cartId: string) {
  try {
    localStorage.setItem(GUEST_CART_KEY, cartId)
  } catch {
    // Blocked storage: the cart lasts for this page load only
  }
}
