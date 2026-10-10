import { useState } from 'react'
import { resetDatabase } from './db'
import { readMockSettings, writeMockSettings, type MockSettings } from './settings'

const latencyOptions = [
  { label: 'None', value: 0 },
  { label: 'Fast (400ms)', value: 400 },
  { label: 'Slow (1.5s)', value: 1500 },
  { label: 'Very slow (3s)', value: 3000 },
]

const errorRateOptions = [
  { label: 'Never', value: 0 },
  { label: '10% of requests', value: 0.1 },
  { label: '50% of requests', value: 0.5 },
  { label: 'Every request', value: 1 },
]

function resetData() {
  resetDatabase()
  window.location.reload()
}

export function DevToolbar() {
  const [settings, setSettings] = useState(readMockSettings)

  function update(next: Partial<MockSettings>) {
    const merged = { ...settings, ...next }
    writeMockSettings(merged)
    setSettings(merged)
  }

  const isDegraded = settings.latencyMs > 400 || settings.errorRate > 0

  return (
    <details className="fixed bottom-4 left-4 z-50 rounded-lg border bg-background text-sm shadow-lg">
      <summary className="cursor-pointer px-3 py-2 font-medium select-none">
        Mock API{isDegraded && <span className="ml-2 text-destructive">degraded</span>}
      </summary>
      <div className="flex w-64 flex-col gap-3 border-t p-3">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Latency</span>
          <select
            id="mock-latency"
            className="rounded-md border bg-background px-2 py-1"
            value={settings.latencyMs}
            onChange={(event) => update({ latencyMs: Number(event.target.value) })}
          >
            {latencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Server errors</span>
          <select
            id="mock-error-rate"
            className="rounded-md border bg-background px-2 py-1"
            value={settings.errorRate}
            onChange={(event) => update({ errorRate: Number(event.target.value) })}
          >
            {errorRateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-md border px-2 py-1 hover:bg-muted"
          onClick={resetData}
        >
          Reset all data
        </button>
      </div>
    </details>
  )
}
