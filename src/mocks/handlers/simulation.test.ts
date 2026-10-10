import { describe, expect, it } from 'vitest'
import { apiErrorSchema } from '@/lib/schemas/common'
import { writeMockSettings } from '@/mocks/settings'
import { api } from '@/test/api'

describe('network simulation', () => {
  it('passes requests through to the real handler by default', async () => {
    const { status } = await api('/api/categories')

    expect(status).toBe(200)
  })

  it('fails every request with a 500 when the error rate is 100%', async () => {
    writeMockSettings({ latencyMs: 0, errorRate: 1 })

    const { status, json } = await api('/api/categories')

    expect(status).toBe(500)
    expect(apiErrorSchema.parse(json).error.code).toBe('server_error')
  })

  it('delays responses by the configured latency', async () => {
    writeMockSettings({ latencyMs: 100, errorRate: 0 })

    const startedAt = performance.now()
    await api('/api/categories')

    // Latency is jittered between 50% and 150% of the setting
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(45)
  })
})
