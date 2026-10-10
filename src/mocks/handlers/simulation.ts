import { delay, http } from 'msw'
import { errorResponse } from '../responses'
import { readMockSettings } from '../settings'

// Runs before every API handler. Returning nothing passes the request on to the real handler.
export const simulationHandlers = [
  http.all('/api/*', async () => {
    const { latencyMs, errorRate } = readMockSettings()
    if (latencyMs > 0) await delay(Math.round(latencyMs * (0.5 + Math.random())))
    if (Math.random() < errorRate) {
      return errorResponse(500, 'server_error', 'Something went wrong on our end. Try again.')
    }
    return undefined
  }),
]
