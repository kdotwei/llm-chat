import { useEffect, useState } from 'react'
import type { MCPServerDefinition, Settings } from '../types'

interface SettingsPanelProps {
  show: boolean
  settings: Settings
  availableModels: string[]
  enabledServers: MCPServerDefinition[]
  memoryCount: number
  onSave: (settings: Settings) => void
  onClose: () => void
  onClearConversation: () => void
  onClearMemory: () => void
}

export default function SettingsPanel({
  show,
  settings,
  availableModels,
  enabledServers,
  memoryCount,
  onSave,
  onClose,
  onClearConversation,
  onClearMemory,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<Settings>(settings)

  useEffect(() => {
    if (show) setDraft(settings)
  }, [show, settings])

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function toggleServer(serverId: string) {
    patch(
      'enabledMcpServers',
      draft.enabledMcpServers.includes(serverId)
        ? draft.enabledMcpServers.filter((id) => id !== serverId)
        : [...draft.enabledMcpServers, serverId],
    )
  }

  function renderModelInput(
    value: string,
    onChange: (next: string) => void,
    placeholder: string,
  ) {
    if (availableModels.length > 0) {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      )
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
      />
    )
  }

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-96 max-w-full flex-col bg-white shadow-2xl transition-transform duration-200 dark:bg-gray-800 ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
            v2 adds long-term memory, multimodal image input, auto routing, and local MCP-style tools.
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Default Model
            </label>
            {renderModelInput(draft.model, (value) => patch('model', value), 'general-model')}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Auto Routing
              </label>
              <input
                type="checkbox"
                checked={draft.autoRoutingEnabled}
                onChange={(e) => patch('autoRoutingEnabled', e.target.checked)}
                className="h-4 w-4 rounded accent-blue-500"
              />
            </div>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Vision Model
                </label>
                {renderModelInput(draft.visionModel, (value) => patch('visionModel', value), 'vision-model')}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Reasoning Model
                </label>
                {renderModelInput(draft.reasoningModel, (value) => patch('reasoningModel', value), 'reasoning-model')}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Long-Term Memory
              </label>
              <input
                type="checkbox"
                checked={draft.longTermMemoryEnabled}
                onChange={(e) => patch('longTermMemoryEnabled', e.target.checked)}
                className="h-4 w-4 rounded accent-blue-500"
              />
            </div>
            <p className="mb-2 text-[11px] text-gray-400 dark:text-gray-500">
              Stored memories: {memoryCount}
            </p>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Retrieved Memory Limit
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={draft.maxMemoryItems}
              onChange={(e) => patch('maxMemoryItems', Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Tool Use
              </label>
              <input
                type="checkbox"
                checked={draft.toolUseEnabled}
                onChange={(e) => patch('toolUseEnabled', e.target.checked)}
                className="h-4 w-4 rounded accent-blue-500"
              />
            </div>
            <div className="space-y-2">
              {['utilities', 'memory', 'browser'].map((serverId) => {
                const server = enabledServers.find((item) => item.id === serverId)
                const isEnabled = draft.enabledMcpServers.includes(serverId)
                const name = server?.name ?? `${serverId} server`
                const description = server?.description ?? 'Available after save.'
                return (
                  <label
                    key={serverId}
                    className="flex items-start gap-3 rounded-2xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleServer(serverId)}
                      className="mt-0.5 h-4 w-4 rounded accent-blue-500"
                    />
                    <div>
                      <div className="font-medium">{name}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              System Prompt
            </label>
            <textarea
              rows={4}
              value={draft.systemPrompt}
              onChange={(e) => patch('systemPrompt', e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Temperature
              </label>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{draft.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={draft.temperature}
              onChange={(e) => patch('temperature', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Top-P
              </label>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{draft.topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={draft.topP}
              onChange={(e) => patch('topP', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Max Tokens
            </label>
            <input
              type="number"
              min={-1}
              value={draft.maxTokens}
              onChange={(e) => patch('maxTokens', parseInt(e.target.value, 10) || -1)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Memory Window
            </label>
            <input
              type="number"
              min={0}
              value={draft.memoryWindow}
              onChange={(e) => patch('memoryWindow', parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              0 keeps the full visible conversation.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={() => {
              onSave(draft)
              onClose()
            }}
            className="w-full rounded-xl bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={onClearConversation}
            className="w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Clear Conversation
          </button>
          <button
            onClick={onClearMemory}
            className="w-full rounded-xl border border-red-200 py-2 text-sm text-red-500 transition hover:bg-red-50"
          >
            Clear Long-Term Memory
          </button>
        </div>
      </aside>
    </>
  )
}
