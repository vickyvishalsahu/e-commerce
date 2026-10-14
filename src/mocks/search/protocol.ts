import { z } from 'zod'

/** Messages from the page to the embedding worker */
export const workerRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('warm-up') }),
  z.object({ type: z.literal('embed'), id: z.int(), text: z.string() }),
])

/** The worker's reply to an embed request. `vector` is null when the model couldn't load. */
export const workerResponseSchema = z.object({
  id: z.int(),
  vector: z.instanceof(Float32Array).nullable(),
})

export type WorkerRequest = z.infer<typeof workerRequestSchema>
export type WorkerResponse = z.infer<typeof workerResponseSchema>
