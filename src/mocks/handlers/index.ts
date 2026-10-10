import { catalogHandlers } from './catalog'
import { cartHandlers } from './cart'
import { authHandlers } from './auth'
import { accountHandlers } from './account'

export const handlers = [...catalogHandlers, ...cartHandlers, ...authHandlers, ...accountHandlers]
