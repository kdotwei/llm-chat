import { useEffect, useState, useCallback } from 'react'
import type { Message, Settings } from './types'
import {
  API_URL, MODELS_URL, LS_KEY, LS_SETTINGS_KEY,
  loadSettings, generateId, buildPayload,
} from './constants'
import { useDarkMode } from './hooks/useDarkMode'
import Header from './components/Header'
import ApiKeyModal from './components/ApiKeyModal'
import SettingsPanel from './components/SettingsPanel'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'

export default function App() {
  const { isDark, toggle: toggleDark } = useDarkMode()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(LS_KEY) ?? '')
  const [showKeyModal, setShowKeyModal] = useState<boolean>(() => !localStorage.getItem(LS_KEY))
  const [keyDraft, setKeyDraft] = useState('')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  useEffect(() => {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

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
      .catch(() => {})
  }, [apiKey])

  function handleSaveKey() {
    const trimmed = keyDraft.trim()
    if (!trimmed) return
    localStorage.setItem(LS_KEY, trimmed)
    setApiKey(trimmed)
    setKeyDraft('')
    setShowKeyModal(false)
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
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
          } catch {}
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

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {showKeyModal && (
        <ApiKeyModal
          hasKey={!!apiKey}
          keyDraft={keyDraft}
          setKeyDraft={setKeyDraft}
          onSave={handleSaveKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}
      <SettingsPanel
        show={showSettings}
        settings={settings}
        availableModels={availableModels}
        onSave={(s) => setSettings(s)}
        onClose={() => setShowSettings(false)}
        onClear={() => { setMessages([]); setShowSettings(false) }}
      />
      <Header
        model={settings.model}
        isDark={isDark}
        onThemeToggle={toggleDark}
        onSettingsClick={() => setShowSettings(true)}
        onKeyClick={() => { setKeyDraft(''); setShowKeyModal(true) }}
      />
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ChatInput
        input={input}
        setInput={setInput}
        isStreaming={isStreaming}
        apiKey={apiKey}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
