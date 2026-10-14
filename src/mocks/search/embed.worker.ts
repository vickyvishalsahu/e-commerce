/// <reference lib="webworker" />
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'
import { EMBEDDING_MODEL, QUERY_INSTRUCTION } from './model'
import { workerRequestSchema, type WorkerResponse } from './protocol'

let extractor: Promise<FeatureExtractionPipeline> | undefined

function loadModel() {
  extractor ??= pipeline('feature-extraction', EMBEDDING_MODEL.id, {
    revision: EMBEDDING_MODEL.revision,
    dtype: EMBEDDING_MODEL.dtype,
  }).catch((error: unknown) => {
    // Forget the failure so a later search tries again, e.g. once the network is back
    extractor = undefined
    throw error
  })
  return extractor
}

async function embed(text: string) {
  try {
    const model = await loadModel()
    const output = await model(QUERY_INSTRUCTION + text, {
      pooling: EMBEDDING_MODEL.pooling,
      normalize: true,
    })
    return output.data instanceof Float32Array ? Float32Array.from(output.data) : null
  } catch (error) {
    console.warn('Search model unavailable, falling back to keyword search', error)
    return null
  }
}

self.addEventListener('message', (event: MessageEvent<unknown>) => {
  const request = workerRequestSchema.safeParse(event.data)
  if (!request.success) return

  if (request.data.type === 'warm-up') {
    loadModel().catch(() => undefined)
    return
  }
  const { id, text } = request.data
  void embed(text).then((vector) => {
    const response: WorkerResponse = { id, vector }
    self.postMessage(response)
  })
})
