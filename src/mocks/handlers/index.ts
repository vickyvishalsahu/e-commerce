import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { orderHandlers } from './orders'
import { simulationHandlers } from './simulation'

// Simulation must stay first so latency and errors apply before any real handler runs
export const handlers = [
  ...simulationHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...orderHandlers,
]
