import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/render'

type ResultListener = (event: {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}) => void
type ErrorListener = (event: { error: SpeechRecognitionErrorCode }) => void
type EndListener = () => void

/** Stands in for the browser's speech recognition, which jsdom doesn't have */
class FakeRecognition {
  static latest: FakeRecognition | undefined
  lang = ''
  interimResults = false
  continuous = false
  listening = false
  private listeners = {
    result: [] as ResultListener[],
    error: [] as ErrorListener[],
    end: [] as EndListener[],
  }

  constructor() {
    FakeRecognition.latest = this
  }

  addEventListener(type: 'result', listener: ResultListener): void
  addEventListener(type: 'error', listener: ErrorListener): void
  addEventListener(type: 'end', listener: EndListener): void
  addEventListener(
    ...args: ['result', ResultListener] | ['error', ErrorListener] | ['end', EndListener]
  ) {
    if (args[0] === 'result') this.listeners.result.push(args[1])
    else if (args[0] === 'error') this.listeners.error.push(args[1])
    else this.listeners.end.push(args[1])
  }

  start() {
    this.listening = true
  }

  stop() {
    this.end()
  }

  abort() {
    this.end()
  }

  /** The shopper says `words`; `isFinal` when they've stopped talking */
  hear(words: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: words }], { isFinal })
    act(() => this.listeners.result.forEach((listener) => listener({ results: [result] })))
  }

  fail(error: SpeechRecognitionErrorCode) {
    act(() => this.listeners.error.forEach((listener) => listener({ error })))
    this.end()
  }

  end() {
    if (!this.listening) return
    this.listening = false
    act(() => this.listeners.end.forEach((listener) => listener()))
  }
}

function recognition() {
  if (!FakeRecognition.latest) throw new Error('Voice search never started')
  return FakeRecognition.latest
}

function supportVoiceSearch() {
  window.SpeechRecognition = FakeRecognition
}

afterEach(() => {
  document.documentElement.lang = ''
  delete window.SpeechRecognition
  FakeRecognition.latest = undefined
})

const searchbox = () => screen.getByRole('searchbox', { name: 'Search products' })

describe('SearchForm voice search', () => {
  it('is only offered where the browser can recognize speech', async () => {
    renderRoute('/')

    await screen.findByRole('searchbox', { name: 'Search products' })
    expect(screen.queryByRole('button', { name: 'Search by voice' })).not.toBeInTheDocument()
  })

  it('fills in the words as the shopper speaks and searches when they stop', async () => {
    supportVoiceSearch()
    document.documentElement.lang = 'en-GB'
    const { router, user } = renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Search by voice' }))

    // Recognizes speech in the page's language
    expect(recognition().lang).toBe('en-GB')
    expect(screen.getByRole('status')).toHaveTextContent('Listening')
    expect(searchbox()).toHaveAttribute('placeholder', 'Listening…')

    recognition().hear('dutch', false)
    expect(searchbox()).toHaveValue('dutch')

    recognition().hear('dutch oven', true)
    recognition().end()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Results for “dutch oven”' }),
    ).toBeInTheDocument()
    expect(router.state.location.search).toBe('?q=dutch+oven')
    expect(screen.getByRole('button', { name: 'Search by voice' })).toBeInTheDocument()
  })

  it('stops listening from the button or Escape without searching', async () => {
    supportVoiceSearch()
    const { router, user } = renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Search by voice' }))
    await user.click(screen.getByRole('button', { name: 'Stop voice search' }))
    expect(screen.getByRole('button', { name: 'Search by voice' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Search by voice' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Search by voice' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(router.state.location.pathname).toBe('/')
  })

  it('explains when the microphone is blocked', async () => {
    supportVoiceSearch()
    const { user } = renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Search by voice' }))
    recognition().fail('not-allowed')

    expect(await screen.findByText(/Microphone access is blocked/)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Search by voice' })).toBeInTheDocument(),
    )
  })
})
