import { z } from 'zod'
import { addressSchema } from '@/lib/schemas/account'
import { userSchema } from '@/lib/schemas/auth'
import { catalogSeedSchema } from '@/lib/schemas/catalog'
import { orderSchema } from '@/lib/schemas/order'
import catalogJson from './data/catalog.json'

const STORAGE_KEY = 'storefront:db:v1'

export const catalog = catalogSeedSchema.parse(catalogJson)

const storedUserSchema = userSchema.extend({ passwordHash: z.string() })

const storedCartSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  items: z.array(z.object({ id: z.string(), variantId: z.string(), quantity: z.int().min(1) })),
})

const storedOrderSchema = orderSchema.omit({ status: true }).extend({
  userId: z.string(),
  idempotencyKey: z.string(),
})

const dbStateSchema = z.object({
  stock: z.record(z.string(), z.int().nonnegative()),
  users: z.array(storedUserSchema),
  sessions: z.record(z.string(), z.string()),
  carts: z.array(storedCartSchema),
  addresses: z.array(addressSchema.extend({ userId: z.string() })),
  orders: z.array(storedOrderSchema),
  wishlists: z.record(z.string(), z.array(z.string())),
  nextOrderNumber: z.int(),
})

export type StoredUser = z.infer<typeof storedUserSchema>
export type StoredCart = z.infer<typeof storedCartSchema>
export type StoredOrder = z.infer<typeof storedOrderSchema>
type DbState = z.infer<typeof dbStateSchema>

export const demoUser = {
  email: 'demo@storefront.test',
  password: 'password123',
  name: 'Demo Shopper',
}

function createInitialState(): DbState {
  return {
    stock: Object.fromEntries(
      catalog.products.flatMap((product) => product.variants.map((v) => [v.id, v.stock])),
    ),
    users: [
      {
        id: 'user_demo',
        email: demoUser.email,
        name: demoUser.name,
        // SHA-256 of demoUser.password
        passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      },
    ],
    sessions: {},
    carts: [],
    addresses: [],
    orders: [],
    wishlists: {},
    nextOrderNumber: 100001,
  }
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = dbStateSchema.safeParse(JSON.parse(raw))
      if (parsed.success) return parsed.data
    }
  } catch {
    // Unreadable or blocked storage falls through to a fresh database
  }
  return createInitialState()
}

let state: DbState | undefined

export function db(): DbState {
  state ??= load()
  return state
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db()))
  } catch {
    // Storage full or blocked: keep working in memory for this session
  }
}

export function resetDatabase() {
  state = createInitialState()
  persist()
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
