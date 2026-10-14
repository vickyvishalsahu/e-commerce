import { z } from 'zod'

/**
 * The sentence embedding model behind product search. The catalog generator embeds products
 * with it and the browser embeds queries with it, so both sides must use exactly these settings.
 */
export const EMBEDDING_MODEL = {
  id: 'Xenova/bge-small-en-v1.5',
  revision: 'ea104dacec62c0de699686887e3f920caeb4f3e3',
  dtype: 'q8',
  pooling: 'cls',
  dimensions: 384,
} as const

/** Product vectors written by `pnpm generate:catalog`. Stale vectors from another model fail to parse. */
export const productEmbeddingsSchema = z.object({
  model: z.literal(EMBEDDING_MODEL.id),
  revision: z.literal(EMBEDDING_MODEL.revision),
  vectors: z.record(z.string(), z.array(z.number()).length(EMBEDDING_MODEL.dimensions)),
})
