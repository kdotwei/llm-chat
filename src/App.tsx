import { useEffect, useState, useCallback } from 'react'
import type { Message, Settings } from './types'
import {
  API_URL, MODELS_URL, LS_KEY, LS_SETTINGS_KEY,
  loadSettings, generateId, buildPayload,
} from './constants'
import Header from './components/Header'
import ApiKeyModal from './components/ApiKeyModal'
import SettingsPanel from './components/SettingsPanel'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'

// ---------------------------------------------------------------------------
// Placeholder — keeps TypeScript happy until the old body below is removed
// ---------------------------------------------------------------------------

function _unused_MarkdownContent({ content }: { content: string }) {
  return (
    <code>
      {content}
            </code>
          )
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>
        },
        ul({ children }) {
          return <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
        },
        li({ children }) {
          return <li className="mb-0.5">{children}</li>
        },
        blockquote({ children }) {
          return (
            <blockquote className="my-2 border-l-4 border-gray-300 pl-3 text-gray-500 italic">
              {children}
            </blockquote>
          )
        },
        h1({ children }) { return <h1 className="mb-2 text-lg font-bold">{children}</h1> },
        h2({ children }) { return <h2 className="mb-2 text-base font-bold">{children}</h2> },
        h3({ children }) { return <h3 className="mb-2 text-sm font-bold">{children}</h3> },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
              {children}
            </a>
          )
        },
        table({ children }) {
          return (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">{children}</th>
        },
        td({ children }) {
          return <td className="border border-gray-300 px-2 py-1">{children}</td>
        },
        hr() {
          return <hr className="my-3 border-gray-200" />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LS_KEY_CONST = LS_KEY  // alias to avoid shadowing in closures

export default function App() {
  // ── Chat state ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // ── API Key ─────────────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(LS_KEY_CONST) ?? '')
  const [showKeyModal, setShowKeyModal] = useState<boolean>(() => !localStorage.getItem(LS_KEY_CONST))
  const [keyDraft, setKeyDraft] = useState('')

  // ── Settings ────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  // Fetch model list whenever the API key is set / changes
  useEffect(() => {
    if (!apiKey) return
    fetch(MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then((r) => r.json())
      .then((data: { data: { id: string }[] }) => {
        const ids = data.data.map((m) => m.id)
        setAvailableModels(ids)
        setSettings((s) => ({
          ...s,
          model: s.model && ids.includes(s.model) ? s.model : (ids[0] ?? s.model),
        }))
      })
      .catch(() => { /* ignore — user can still type a model name */ })
  }, [apiKey])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  // Scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSaveKey() {
    const trimmed = keyDraft.trim()
    if (!trimmed) return
    localStorage.setItem(LS_KEY_CONST, trimmed)
    setApiKey(trimmed)
    setKeyDraft('')
    setShowKeyModal(false)
  }

  function patchSettings<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  function handleClearConversation() {
    setMessages([])
  }

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || !apiKey) return

    const userMessage: Message = { id: generateId(), role: 'user', content: trimmed }
    const historySnapshot = [...messages, userMessage]

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    const assistantId = generateId()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const payloadMessages = buildPayload(historySnapshot, settings)

      const body: Record<string, unknown> = {
        model: settings.model,
        messages: payloadMessages,
        stream: true,
        temperature: settings.temperature,
        top_p: settings.topP,
      }
      if (settings.maxTokens > 0) body.max_tokens = settings.maxTokens

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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
          const tl = line.trim()
          if (!tl.startsWith('data: ')) continue
          const payload = tl.slice('data: '.length)
          if (payload === '[DONE]') break outer
          try {
            const parsed = JSON.parse(payload)
            const delta: string = parsed.choices?.[0]?.delta?.content ?? ''
            if (!delta) continue
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: m.content + delta } : m),
            )
          } catch { /* malformed chunk — skip */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: `⚠️ Error: ${msg}` } : m),
      )
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, apiKey, messages, settings])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900">

      {/* ── API Key Modal ─────────────────────────────────────────── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold">Enter your API Key</h2>
            <p className="mb-4 text-xs text-gray-500">
              Stored only in this browser's localStorage. Never bundled into the app.
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
                <button onClick={() => setShowKeyModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
              )}
              <button disabled={!keyDraft.trim()} onClick={handleSaveKey}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-40">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Panel ────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowSettings(false)} />
      )}
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col bg-white shadow-2xl
        transition-transform duration-200 ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={() => setShowSettings(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 p-4">

          {/* Model */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Model
            </label>
            {availableModels.length > 0 ? (
              <select
                value={settings.model}
                onChange={(e) => patchSettings('model', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={settings.model}
                onChange={(e) => patchSettings('model', e.target.value)}
                placeholder="model-id"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            )}
          </div>

          {/* System Prompt */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              System Prompt
            </label>
            <textarea
              rows={4}
              value={settings.systemPrompt}
              onChange={(e) => patchSettings('systemPrompt', e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Temperature
              </label>
              <span className="text-xs font-mono text-gray-600">{settings.temperature.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={2} step={0.01}
              value={settings.temperature}
              onChange={(e) => patchSettings('temperature', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
              <span>0 — precise</span><span>2 — creative</span>
            </div>
          </div>

          {/* Top-P */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Top-P
              </label>
              <span className="text-xs font-mono text-gray-600">{settings.topP.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={1} step={0.01}
              value={settings.topP}
              onChange={(e) => patchSettings('topP', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Max Tokens <span className="font-normal normal-case text-gray-400">(-1 = unlimited)</span>
            </label>
            <input
              type="number" min={-1}
              value={settings.maxTokens}
              onChange={(e) => patchSettings('maxTokens', parseInt(e.target.value) || -1)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Memory Window */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Memory Window <span className="font-normal normal-case text-gray-400">(turns, 0 = full history)</span>
            </label>
            <input
              type="number" min={0}
              value={settings.memoryWindow}
              onChange={(e) => patchSettings('memoryWindow', parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              1 turn = 1 user message + 1 assistant reply.
            </p>
          </div>

        </div>

        {/* Clear conversation */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => { handleClearConversation(); setShowSettings(false) }}
            className="w-full rounded-xl border border-red-200 py-2 text-sm text-red-500 transition hover:bg-red-50"
          >
            Clear Conversation
          </button>
        </div>
      </aside>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="w-18 flex items-center">
          <span className="text-xs text-gray-400 truncate max-w-[80px]" title={settings.model}>
            {settings.model || '—'}
          </span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">LLM Chatroom</h1>
        <div className="flex items-center gap-1">
          {/* Settings gear */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
            </svg>
          </button>
          {/* API Key */}
          <button
            onClick={() => { setKeyDraft(''); setShowKeyModal(true) }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            title="Set API Key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a.75.75 0 0 0-.221.53V19.5a.75.75 0 0 0 .75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5a.75.75 0 0 0 .75-.75V16.5h1.5a.75.75 0 0 0 .53-.22l.5-.5c.19-.189.517-.288.907-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Message list ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400">Send a message to get started.</p>
          )}

          {messages.map((msg) => {
            if (msg.role === 'assistant' && msg.content === '') return null
            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600">
                    AI
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-blue-500 text-white'
                    : 'rounded-bl-sm bg-white text-gray-800 ring-1 ring-gray-200'
                }`}>
                  {msg.role === 'assistant'
                    ? <MarkdownContent content={msg.content} />
                    : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    You
                  </div>
                )}
              </div>
            )
          })}

          {/* Streaming indicator */}
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

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input area ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
        <form
          className="mx-auto flex max-w-2xl items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
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
    </div>
  )
}
