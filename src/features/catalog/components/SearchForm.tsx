import { cn } from 'cn'
import { MicIcon, SearchIcon } from 'lucide-react'
import { useRef } from 'react'
import { Form, useLocation, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useVoiceSearch } from '../use-voice-search'

export function SearchForm() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const currentQuery = pathname === '/search' ? (searchParams.get('q') ?? '') : ''
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const voice = useVoiceSearch((transcript, isFinal) => {
    const input = inputRef.current
    if (!input) return
    // Show the words as they're spoken, then search once the shopper stops talking
    input.value = transcript
    if (isFinal && transcript) formRef.current?.requestSubmit()
  })

  return (
    <search>
      <Form
        ref={formRef}
        action="/search"
        className="relative"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && voice.listening) voice.stop()
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          // Remount when the URL query changes so back/forward updates the field
          key={currentQuery}
          ref={inputRef}
          id="site-search"
          type="search"
          name="q"
          defaultValue={currentQuery}
          placeholder={voice.listening ? 'Listening…' : 'Search or describe what you need'}
          required
          className={cn('pl-9', voice.supported && 'pr-9')}
        />
        {voice.supported && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={voice.listening ? 'Stop voice search' : 'Search by voice'}
            onClick={voice.listening ? voice.stop : voice.start}
            className={cn(
              'absolute top-1/2 right-1 -translate-y-1/2',
              voice.listening && 'text-destructive hover:text-destructive',
            )}
          >
            {voice.listening && (
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-destructive/20 motion-reduce:animate-none"
              />
            )}
            <MicIcon aria-hidden className="size-4" />
          </Button>
        )}
        <output className="sr-only">
          {voice.listening ? 'Listening. Say what you need, or press Escape to stop.' : ''}
        </output>
      </Form>
    </search>
  )
}
