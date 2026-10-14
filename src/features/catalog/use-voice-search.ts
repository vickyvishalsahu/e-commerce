import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface SpeechAlternative {
  transcript: string
}

interface SpeechResult extends ArrayLike<SpeechAlternative> {
  isFinal: boolean
}

/** The parts of the Web Speech API we use. TypeScript ships its events but not the recognizer. */
interface BrowserSpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  addEventListener(
    type: 'result',
    listener: (event: { results: ArrayLike<SpeechResult> }) => void,
  ): void
  addEventListener(
    type: 'error',
    listener: (event: { error: SpeechRecognitionErrorCode }) => void,
  ): void
  addEventListener(type: 'end', listener: () => void): void
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
}

const errorMessages: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  'not-allowed':
    'Microphone access is blocked. Allow it in your browser settings to search by voice.',
  'service-not-allowed':
    'Microphone access is blocked. Allow it in your browser settings to search by voice.',
  'audio-capture': 'No microphone found. Check that one is connected and try again.',
  'no-speech': "Didn't catch that. Tap the microphone and try again.",
  network: 'Voice search needs an internet connection. Type your search instead.',
}
const FALLBACK_ERROR = "Voice search isn't available right now. Type your search instead."

/**
 * Dictation through the browser's speech recognition. `onTranscript` gets the words so far while
 * the shopper speaks, then once more with `isFinal` when they stop. Unsupported browsers
 * (Firefox) get `supported: false`, so the UI can leave voice search out.
 */
export function useVoiceSearch(onTranscript: (transcript: string, isFinal: boolean) => void) {
  const [Recognition] = useState(() => window.SpeechRecognition ?? window.webkitSpeechRecognition)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  })

  // Leaving the page shouldn't leave the microphone on
  useEffect(() => () => recognitionRef.current?.abort(), [])

  function start() {
    if (!Recognition || recognitionRef.current) return
    const recognition = new Recognition()
    recognition.lang = document.documentElement.lang || navigator.language
    recognition.interimResults = true
    recognition.continuous = false

    recognition.addEventListener('result', ({ results }) => {
      const parts = Array.from(results)
      const transcript = parts
        .map((result) => result[0]?.transcript ?? '')
        .join('')
        .trim()
      onTranscriptRef.current(transcript, parts.at(-1)?.isFinal ?? false)
    })
    recognition.addEventListener('error', ({ error }) => {
      // Aborting is how stopping early ends, not a failure
      if (error === 'aborted') return
      toast.error(errorMessages[error] ?? FALLBACK_ERROR)
    })
    recognition.addEventListener('end', () => {
      recognitionRef.current = null
      setListening(false)
    })

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  return { supported: Recognition !== undefined, listening, start, stop }
}
