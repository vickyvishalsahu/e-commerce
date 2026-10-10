import { catalogHandlers } from './catalog'
import { cartHandlers } from './cart'
import { authHandlers } from './auth'

export const handlers = [...catalogHandlers, ...cartHandlers, ...authHandlers]
