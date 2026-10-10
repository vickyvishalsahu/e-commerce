import { catalogHandlers } from './catalog'
import { cartHandlers } from './cart'
import { authHandlers } from './auth'
import { accountHandlers } from './account'
import { orderHandlers } from './orders'

export const handlers = [
  ...catalogHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...orderHandlers,
]
