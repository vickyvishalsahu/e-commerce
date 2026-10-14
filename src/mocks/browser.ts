import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { loadProductVectors, setQueryEmbedder } from './search/search'
import { createWorkerEmbedder } from './search/worker-embedder'

export const worker = setupWorker(...handlers)

const embedder = createWorkerEmbedder()
setQueryEmbedder(embedder.embed)

function warmUp() {
  embedder.warmUp()
  void loadProductVectors()
}

/** Starts downloading the search model once the page is idle, so the first search rarely waits */
export function warmUpSearch() {
  if ('requestIdleCallback' in window) requestIdleCallback(warmUp)
  else setTimeout(warmUp, 2000)
}
