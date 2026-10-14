import { productEmbeddingsSchema } from './model'
import { rankProducts, type SearchableProduct } from './rank'

/** Turns a query into a vector, or null when the model isn't available */
export type QueryEmbedder = (query: string) => Promise<Float32Array | null>

/** Node has no model to run, so tests use keyword search unless a test sets an embedder */
export const noQueryEmbedder: QueryEmbedder = () => Promise.resolve(null)

let embedQuery = noQueryEmbedder
let productVectors: Promise<Record<string, number[]>> | undefined

export function setQueryEmbedder(embedder: QueryEmbedder) {
  embedQuery = embedder
}

/** The vectors are big and only needed once someone searches, so they load on first use */
export function loadProductVectors() {
  productVectors ??= import('../data/product-embeddings.json').then(
    (module) => productEmbeddingsSchema.parse(module.default).vectors,
  )
  return productVectors
}

/** Relevance scores for the products that match a query, keyed by product id */
export async function searchProducts(products: SearchableProduct[], query: string) {
  const normalized = query.trim().toLowerCase()
  const queryVector = await embedQuery(normalized)
  const semantic = queryVector && { queryVector, productVectors: await loadProductVectors() }
  return rankProducts(products, normalized, semantic)
}
