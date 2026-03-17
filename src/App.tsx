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

const API_URL = import.meta.env.VITE_API_URL as string
const API_MODEL = (import.meta.env.VITE_API_MODEL as string | undefined) ?? 'default'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LS_KEY = 'llm_chatroom_api_key'

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
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(LS_KEY) ?? '')
  const [showKeyModal, setShowKeyModal] = useState<boolean>(() => !localStorage.getItem(LS_KEY))
  const [keyDraft, setKeyDraft] = useState('')

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

  function handleSaveKey() {
    const trimmed = keyDraft.trim()
    if (!trimmed) return
    localStorage.setItem(LS_KEY, trimmed)
    setApiKey(trimmed)
    setKeyDraft('')
    setShowKeyModal(false)
  }

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || !apiKey) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
    }

    // Snapshot history BEFORE appending the user message so the payload
    // reflects the full conversation including the new user turn.
    const historySnapshot = [...messages, userMessage]

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // Insert an empty assistant bubble immediately so the typewriter effect
    // has a target to update.
    const assistantId = generateId()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: API_MODEL,
          messages: historySnapshot.map(({ role, content }) => ({ role, content })),
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Server error: ${response.status} ${response.statusText}\n${errorBody}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        for (const line of chunk.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const payload = trimmed.slice('data: '.length)
          if (payload === '[DONE]') break outer

          try {
            const parsed = JSON.parse(payload)
            const delta: string = parsed.choices?.[0]?.delta?.content ?? ''
            if (!delta) continue

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + delta }
                  : m,
              ),
            )
          } catch {
            // Malformed chunk — skip silently
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${message}` }
            : m,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
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
      {/* ── API Key Modal ───────────────────────────────────────────── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold">Enter your API Key</h2>
            <p className="mb-4 text-xs text-gray-500">
              Your key is stored only in this browser's localStorage and is never sent anywhere except directly to the API server.
            </p>
            <input
              type="password"
              autoFocus
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="sk-…"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
            />
            <div className="mt-4 flex justify-end gap-2">
              {apiKey && (
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                disabled={!keyDraft.trim()}
                onClick={handleSaveKey}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="w-9" />{/* spacer */}
        <h1 className="text-lg font-semibold tracking-tight">LLM Chatroom</h1>
        <button
          onClick={() => { setKeyDraft(''); setShowKeyModal(true) }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          title="Set API Key"
          aria-label="Set API Key"
        >
          {/* Key icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a.75.75 0 0 0-.221.53V19.5a.75.75 0 0 0 .75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5a.75.75 0 0 0 .75-.75V16.5h1.5a.75.75 0 0 0 .53-.22l.5-.5c.19-.189.517-.288.907-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/* ── Message list ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {visibleMessages.length === 0 && (
            <p className="text-center text-sm text-gray-400">
              Send a message to get started.
            </p>
          )}

          {visibleMessages.map((msg) => {
            // Skip the empty assistant placeholder — the streaming indicator covers this state
            if (msg.role === 'assistant' && msg.content === '') return null
            return (
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
            )
          })}

          {/* Streaming indicator — only shown while the assistant bubble is still empty */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
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
            disabled={!input.trim() || isStreaming || !apiKey}
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
