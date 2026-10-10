import { HttpResponse, http } from 'msw'
import { loginRequestSchema, registerRequestSchema, type Session } from '@/lib/schemas/auth'
import { mergeGuestCart } from '../carts'
import { createId, db, hashPassword, persist, type StoredUser } from '../db'
import {
  errorResponse,
  getSessionToken,
  getSessionUserId,
  readJson,
  unauthorized,
  validationError,
} from '../responses'

function startSession(user: StoredUser, guestCartId: string | undefined): Session {
  const token = createId('session')
  db().sessions[token] = user.id
  if (guestCartId) mergeGuestCart(guestCartId, user.id)
  persist()
  return { token, user: { id: user.id, email: user.email, name: user.name } }
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    const body = await readJson(request, registerRequestSchema)
    if (!body.success) return validationError(body.error)
    const { email, password, name, guestCartId } = body.data

    const normalizedEmail = email.toLowerCase()
    if (db().users.some((user) => user.email === normalizedEmail)) {
      return errorResponse(409, 'email_taken', 'An account with this email already exists', {
        fieldErrors: { email: ['An account with this email already exists'] },
      })
    }

    const user: StoredUser = {
      id: createId('user'),
      email: normalizedEmail,
      name,
      passwordHash: await hashPassword(password),
    }
    db().users.push(user)
    return HttpResponse.json(startSession(user, guestCartId), { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await readJson(request, loginRequestSchema)
    if (!body.success) return validationError(body.error)
    const { email, password, guestCartId } = body.data

    const user = db().users.find((u) => u.email === email.toLowerCase())
    if (!user || user.passwordHash !== (await hashPassword(password))) {
      return errorResponse(401, 'invalid_credentials', 'Email or password is incorrect')
    }
    return HttpResponse.json(startSession(user, guestCartId))
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const token = getSessionToken(request)
    if (token !== undefined) {
      delete db().sessions[token]
      persist()
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const userId = getSessionUserId(request)
    const user = db().users.find((u) => u.id === userId)
    if (!user) return unauthorized()
    return HttpResponse.json({ id: user.id, email: user.email, name: user.name })
  }),
]
