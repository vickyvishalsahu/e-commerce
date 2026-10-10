import { z } from 'zod'

const STORAGE_KEY = 'storefront:mock-settings'

export const mockSettingsSchema = z.object({
  latencyMs: z.int().min(0).max(10_000),
  errorRate: z.number().min(0).max(1),
})

export type MockSettings = z.infer<typeof mockSettingsSchema>

export const defaultMockSettings: MockSettings = {
  latencyMs: import.meta.env.MODE === 'test' ? 0 : 400,
  errorRate: 0,
}

export function readMockSettings(): MockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? mockSettingsSchema.safeParse(JSON.parse(raw)) : undefined
    return parsed?.success ? parsed.data : defaultMockSettings
  } catch {
    return defaultMockSettings
  }
}

export function writeMockSettings(settings: MockSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Blocked storage: settings fall back to defaults
  }
}
