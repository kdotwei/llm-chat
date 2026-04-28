import { useEffect, useState } from 'react'
import type { Attachment, Message, Settings, ToolCall } from './types'
import {
  API_URL,
  LS_KEY,
  LS_SETTINGS_KEY,
  MODELS_URL,
  buildHistorySlice,
  generateId,
  loadMemories,
  loadSettings,
  saveMemories,
} from './constants'
import { useDarkMode } from './hooks/useDarkMode'
import Header from './components/Header'
import ApiKeyModal from './components/ApiKeyModal'
import SettingsPanel from './components/SettingsPanel'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import { extractMemories, mergeMemories, searchMemories } from './lib/memory'
import { MCP_SERVERS, executeTool, getEnabledTools } from './lib/mcpTools'
import { routeModel } from './lib/router'

interface ChatApiToolCall {
  id: string
  function?: {
    name?: string
    arguments?: string
  }
}

interface ChatApiMessage {
  content?: string | Array<{ type?: string; text?: string }>
  tool_calls?: ChatApiToolCall[]
}

function extractAssistantText(content: ChatApiMessage['content']): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n')
  }
  return ''
}

function normalizeToolCalls(toolCalls: ChatApiToolCall[] = []): ToolCall[] {
  return toolCalls
    .filter((toolCall) => toolCall.function?.name)
    .map((toolCall) => ({
      id: toolCall.id || generateId(),
      name: toolCall.function?.name ?? 'unknown_tool',
      arguments: toolCall.function?.arguments ?? '{}',
    }))
}

function buildApiMessages(messages: Message[], settings: Settings, memoryContext: string[]) {
  const systemSections = [
    settings.systemPrompt.trim(),
    'If tool results include URLs or source fields, summarize them directly in chat and cite the sources as Markdown links. If a web-search tool reports no usable results or a network/provider failure, say that clearly instead of inventing news.',
    memoryContext.length > 0
      ? `Relevant long-term memory:\n${memoryContext.map((item) => `- ${item}`).join('\n')}`
      : '',
  ].filter(Boolean)

  const systemMessages: Array<Record<string, unknown>> = [
    {
      role: 'system',
      content: systemSections.join('\n\n'),
    },
  ]

  const history = buildHistorySlice(messages, settings.memoryWindow)
  const apiMessages = history.map((message) => {
    if (message.role === 'user' && message.attachments && message.attachments.length > 0) {
      return {
        role: 'user',
        content: [
          ...(message.content ? [{ type: 'text', text: message.content }] : []),
          ...message.attachments.map((attachment) => ({
            type: 'image_url',
            image_url: { url: attachment.dataUrl },
          })),
        ],
      }
    }

    if (message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0) {
      return {
        role: 'assistant',
        content: message.content,
        tool_calls: message.toolCalls.map((toolCall) => ({
          id: toolCall.id,
          type: 'function',
          function: {
            name: toolCall.name,
            arguments: toolCall.arguments,
          },
        })),
      }
    }

    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        name: message.name,
        content: message.content,
      }
    }

    return {
      role: message.role,
      content: message.content,
    }
  })

  return [...systemMessages, ...apiMessages]
}

async function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error(`Failed to read ${file.name}.`))
        return
      }

      resolve({
        id: generateId(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: result,
      })
    }
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

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
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [memories, setMemories] = useState(loadMemories)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (!apiKey) return
    fetch(MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then((r) => r.json())
      .then((data: { data: { id: string }[] }) => {
        const ids = data.data.map((model) => model.id)
        setAvailableModels(ids)
        setSettings((current) => ({
          ...current,
          model: current.model && ids.includes(current.model) ? current.model : (ids[0] ?? current.model),
          visionModel: current.visionModel && ids.includes(current.visionModel)
            ? current.visionModel
            : (current.visionModel || ids[0] || ''),
          reasoningModel: current.reasoningModel && ids.includes(current.reasoningModel)
            ? current.reasoningModel
            : (current.reasoningModel || ids[0] || ''),
        }))
      })
      .catch(() => {})
  }, [apiKey])

  function updateMemories(next: ReturnType<typeof mergeMemories>) {
    const trimmed = next.slice(0, 100)
    setMemories(trimmed)
    saveMemories(trimmed)
  }

  function rememberUserInput(userText: string) {
    if (!settings.longTermMemoryEnabled) return
    const extracted = extractMemories(userText)
    if (extracted.length === 0) return
    updateMemories(mergeMemories(memories, extracted))
  }

  async function callChatApi(body: Record<string, unknown>) {
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

    return response
  }

  async function runStructuredTurn(historySnapshot: Message[], userMessage: Message) {
    const route = routeModel(userMessage.content, userMessage.attachments ?? [], settings, availableModels)
    setProcessingStatus(`Routing to ${route.label.toLowerCase()} model...`)
    const retrievedMemories = settings.longTermMemoryEnabled
      ? searchMemories(userMessage.content, memories, settings.maxMemoryItems)
      : []
    const memoryContext = retrievedMemories.map((memory) => memory.text)
    const enabledTools = getEnabledTools(settings)
    const workingHistory = [...historySnapshot]
    const uiMessages: Message[] = []

    for (let iteration = 0; iteration < 5; iteration += 1) {
      setProcessingStatus(iteration === 0 ? 'Thinking through your request...' : 'Reviewing tool results...')

      const body: Record<string, unknown> = {
        model: route.model,
        messages: buildApiMessages(workingHistory, settings, memoryContext),
        stream: false,
        temperature: settings.temperature,
        top_p: settings.topP,
      }

      if (settings.maxTokens > 0) body.max_tokens = settings.maxTokens
      if (enabledTools.length > 0) body.tools = enabledTools

      const response = await callChatApi(body)
      const data = await response.json()
      const assistantMessage = data.choices?.[0]?.message as ChatApiMessage | undefined
      if (!assistantMessage) throw new Error('The API returned an empty response.')

      const toolCalls = normalizeToolCalls(assistantMessage.tool_calls)
      const assistantText = extractAssistantText(assistantMessage.content)

      if (toolCalls.length === 0) {
        setProcessingStatus('Finalizing the answer...')
        return {
          route,
          messages: [
            ...uiMessages,
            {
              id: generateId(),
              role: 'assistant' as const,
              content: assistantText || 'No assistant text was returned.',
              model: route.model,
              routeLabel: route.label,
              routeReason: route.reason,
            },
          ],
        }
      }

      workingHistory.push({
        id: generateId(),
        role: 'assistant',
        content: assistantText,
        model: route.model,
        routeLabel: route.label,
        routeReason: route.reason,
        toolCalls,
      })

      for (const toolCall of toolCalls) {
        let toolResult = ''

        try {
          const args = JSON.parse(toolCall.arguments || '{}') as Record<string, unknown>
          if (toolCall.name === 'browser_search_web') {
            setProcessingStatus(`Searching the web for “${String(args.query ?? '').trim() || 'your request'}”...`)
          } else if (toolCall.name === 'memory_search') {
            setProcessingStatus('Checking long-term memory...')
          } else if (toolCall.name === 'utilities_time_now') {
            setProcessingStatus('Checking the current time...')
          } else if (toolCall.name === 'browser_open_url') {
            setProcessingStatus('Opening the requested page...')
          } else {
            setProcessingStatus(`Running ${toolCall.name}...`)
          }
          toolResult = await executeTool(toolCall.name, args, { memories })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown tool error'
          toolResult = JSON.stringify({ error: message })
        }

        const toolMessage: Message = {
          id: generateId(),
          role: 'tool',
          name: toolCall.name,
          toolCallId: toolCall.id,
          content: toolResult,
        }

        workingHistory.push(toolMessage)
        uiMessages.push(toolMessage)
      }
    }

    throw new Error('Tool loop limit reached before the model produced a final answer.')
  }

  async function runStreamingTurn(historySnapshot: Message[], userMessage: Message) {
    const route = routeModel(userMessage.content, userMessage.attachments ?? [], settings, availableModels)
    setProcessingStatus(`Routing to ${route.label.toLowerCase()} model...`)
    const retrievedMemories = settings.longTermMemoryEnabled
      ? searchMemories(userMessage.content, memories, settings.maxMemoryItems)
      : []
    const assistantId = generateId()

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        model: route.model,
        routeLabel: route.label,
        routeReason: route.reason,
      },
    ])

    const body: Record<string, unknown> = {
      model: route.model,
      messages: buildApiMessages(historySnapshot, settings, retrievedMemories.map((memory) => memory.text)),
      stream: true,
      temperature: settings.temperature,
      top_p: settings.topP,
    }

    if (settings.maxTokens > 0) body.max_tokens = settings.maxTokens

    setProcessingStatus('Waiting for the model to start responding...')
    const response = await callChatApi(body)
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Streaming is not available on this response.')

    const decoder = new TextDecoder()
    let buffer = ''
    let finished = false

    while (!finished) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const payload = trimmed.slice('data: '.length)
        if (payload === '[DONE]') {
          finished = true
          break
        }

        try {
          const parsed = JSON.parse(payload)
          const delta = parsed.choices?.[0]?.delta?.content ?? ''
          if (!delta) continue
          setProcessingStatus('Generating the answer...')
          setMessages((prev) =>
            prev.map((message) => (
              message.id === assistantId
                ? { ...message, content: message.content + delta }
                : message
            )),
          )
        } catch {
          // Ignore malformed SSE chunks from partially buffered payloads.
        }
      }
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const attachments = await Promise.all(imageFiles.map(fileToAttachment))
    setPendingAttachments((prev) => [...prev, ...attachments])
  }

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
    const hasAttachments = pendingAttachments.length > 0
    if ((!trimmed && !hasAttachments) || isStreaming || !apiKey) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      attachments: pendingAttachments,
    }

    const historySnapshot = [...messages, userMessage]
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setPendingAttachments([])
    setIsStreaming(true)
    setProcessingStatus('Message received. Preparing the request...')

    try {
      if (settings.toolUseEnabled || hasAttachments) {
        const result = await runStructuredTurn(historySnapshot, userMessage)
        setMessages((prev) => [...prev, ...result.messages])
      } else {
        await runStreamingTurn(historySnapshot, userMessage)
      }

      rememberUserInput(userMessage.content)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: `Error: ${message}`,
        },
      ])
    } finally {
      setIsStreaming(false)
      setProcessingStatus(null)
    }
  }

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
        enabledServers={MCP_SERVERS}
        memoryCount={memories.length}
        onSave={(next) => setSettings(next)}
        onClose={() => setShowSettings(false)}
        onClearConversation={() => { setMessages([]); setShowSettings(false) }}
        onClearMemory={() => updateMemories([])}
      />
      <Header
        model={settings.model}
        routedModels={{
          autoRoutingEnabled: settings.autoRoutingEnabled,
          visionModel: settings.visionModel,
          reasoningModel: settings.reasoningModel,
        }}
        memoryCount={memories.length}
        processingStatus={processingStatus}
        isDark={isDark}
        onThemeToggle={toggleDark}
        onSettingsClick={() => setShowSettings(true)}
        onKeyClick={() => { setKeyDraft(''); setShowKeyModal(true) }}
      />
      <MessageList messages={messages} isStreaming={isStreaming} processingStatus={processingStatus} />
      <ChatInput
        input={input}
        setInput={setInput}
        attachments={pendingAttachments}
        onFilesSelected={handleFilesSelected}
        onRemoveAttachment={(id) => setPendingAttachments((prev) => prev.filter((file) => file.id !== id))}
        isStreaming={isStreaming}
        processingStatus={processingStatus}
        apiKey={apiKey}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
