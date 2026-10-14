import { workerResponseSchema, type WorkerRequest } from './protocol'
import type { QueryEmbedder } from './search'

/** How long a search waits for the model to download before using keyword search instead */
const MODEL_WAIT_MS = 4000

/** Embeds search queries in a Web Worker so loading and running the model never blocks the page */
export function createWorkerEmbedder() {
  const worker = new Worker(new URL('./embed.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, (vector: Float32Array | null) => void>()
  const cache = new Map<string, Float32Array>()
  let nextId = 1

  const send = (request: WorkerRequest) => worker.postMessage(request)

  worker.addEventListener('message', (event: MessageEvent<unknown>) => {
    const response = workerResponseSchema.safeParse(event.data)
    if (!response.success) return
    pending.get(response.data.id)?.(response.data.vector)
    pending.delete(response.data.id)
  })

  const embed: QueryEmbedder = (query) => {
    const cached = cache.get(query)
    if (cached) return Promise.resolve(cached)

    return new Promise((resolve) => {
      const id = nextId++
      pending.set(id, (vector) => {
        if (vector) cache.set(query, vector)
        resolve(vector)
      })
      send({ type: 'embed', id, text: query })
      setTimeout(() => {
        if (!pending.delete(id)) return
        resolve(null)
      }, MODEL_WAIT_MS)
    })
  }

  return { embed, warmUp: () => send({ type: 'warm-up' }) }
}
