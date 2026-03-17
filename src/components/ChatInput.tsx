import { useEffect, useRef } from 'react'

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  isStreaming: boolean
  apiKey: string
  onSubmit: () => void
}

export default function ChatInput({ input, setInput, isStreaming, apiKey, onSubmit }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
      <form
        className="mx-auto flex max-w-2xl items-end gap-2"
        onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      >
        <textarea
          ref={textareaRef}
          className="max-h-40 min-h-[44px] flex-1 resize-none overflow-y-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          placeholder="Message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          value={input}
          disabled={isStreaming}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || !apiKey}
          className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-[1px]">
            <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
          </svg>
        </button>
      </form>
    </footer>
  )
}
