import { HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ApiError, ApiErrorCode } from '@/lib/schemas/common'
import { db } from './db'

type ErrorExtras = Pick<ApiError['error'], 'fieldErrors' | 'unavailableItems'>

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  extras: ErrorExtras = {},
) {
  const body: ApiError = { error: { code, message, ...extras } }
  return HttpResponse.json(body, { status })
}

export function validationError(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'body'
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }
  return errorResponse(400, 'validation_error', 'Some fields are invalid', { fieldErrors })
}

export function notFound(message: string) {
  return errorResponse(404, 'not_found', message)
}

export function unauthorized() {
  return errorResponse(401, 'unauthorized', 'Sign in to continue')
}

export async function readJson<T extends z.ZodType>(request: Request, schema: T) {
  const body: unknown = await request.json().catch(() => undefined)
  return schema.safeParse(body)
}

export function readQuery<T extends z.ZodType>(request: Request, schema: T) {
  return schema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
}

export function getSessionToken(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
}

export function getSessionUserId(request: Request) {
  const token = getSessionToken(request)
  return token === undefined ? undefined : db().sessions[token]
}
