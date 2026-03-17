import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const MOCK_REPLIES = [
  "That's an interesting question! Let me think about it.",
  'Sure, I can help with that.',
  'Great point! Here is what I think...',
  'I understand. Could you give me a bit more context?',
  'Absolutely! Here is a detailed explanation for you.',
]

function pickMockReply(): string {
  return MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'system',
      content: 'You are a helpful assistant.',
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea height to fit its content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  // Scroll to the latest message whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // --- Mock: replace this block with a real API call later ---
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: pickMockReply(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    // -----------------------------------------------------------

    setIsStreaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter alone → submit; Shift+Enter → new line (default behaviour)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const visibleMessages = messages.filter((m) => m.role !== 'system')

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-center border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">LLM Chatroom</h1>
      </header>

      {/* ── Message list ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {visibleMessages.length === 0 && (
            <p className="text-center text-sm text-gray-400">
              Send a message to get started.
            </p>
          )}

          {visibleMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for assistant */}
              {msg.role === 'assistant' && (
                <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600">
                  AI
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-blue-500 text-white'
                    : 'rounded-bl-sm bg-white text-gray-800 ring-1 ring-gray-200'
                }`}
              >
                {msg.content}
              </div>

              {/* Avatar for user */}
              {msg.role === 'user' && (
                <div className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  You
                </div>
              )}
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600">
                AI
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
              </div>
            </div>
          )}

          {/* Invisible anchor to scroll into view */}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input area ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
        <form
          className="mx-auto flex max-w-2xl items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
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
            disabled={!input.trim() || isStreaming}
            className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            {/* Paper-plane icon (inline SVG, no extra deps needed) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 translate-x-[1px]"
            >
              <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  )
}
