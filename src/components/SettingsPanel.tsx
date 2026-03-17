import { useState, useEffect } from 'react'
import type { Settings } from '../types'

interface SettingsPanelProps {
  show: boolean
  settings: Settings
  availableModels: string[]
  onSave: (s: Settings) => void
  onClose: () => void
  onClear: () => void
}

export default function SettingsPanel({
  show,
  settings,
  availableModels,
  onSave,
  onClose,
  onClear,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<Settings>(settings)

  // Reset draft to committed settings whenever the panel opens
  useEffect(() => {
    if (show) setDraft(settings)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function handleSave() {
    onSave(draft)
    onClose()
  }

  return (
    <>
      {show && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col bg-white shadow-2xl dark:bg-gray-800
        transition-transform duration-200 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
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

        <div className="flex-1 overflow-y-auto space-y-6 p-4">

          {/* Model */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Model
            </label>
            {availableModels.length > 0 ? (
              <select
                value={draft.model}
                onChange={(e) => patch('model', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={draft.model}
                onChange={(e) => patch('model', e.target.value)}
                placeholder="model-id"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              />
            )}
          </div>

          {/* System Prompt */}
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

          {/* Temperature */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Temperature
              </label>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{draft.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={2} step={0.01}
              value={draft.temperature}
              onChange={(e) => patch('temperature', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
              <span>0 — precise</span><span>2 — creative</span>
            </div>
          </div>

          {/* Top-P */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Top-P
              </label>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{draft.topP.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.01}
              value={draft.topP}
              onChange={(e) => patch('topP', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Max Tokens <span className="font-normal normal-case text-gray-400 dark:text-gray-500">(-1 = unlimited)</span>
            </label>
            <input
              type="number" min={-1}
              value={draft.maxTokens}
              onChange={(e) => patch('maxTokens', parseInt(e.target.value) || -1)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Memory Window */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Memory Window <span className="font-normal normal-case text-gray-400 dark:text-gray-500">(turns, 0 = full history)</span>
            </label>
            <input
              type="number" min={0}
              value={draft.memoryWindow}
              onChange={(e) => patch('memoryWindow', parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              1 turn = 1 user message + 1 assistant reply.
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={onClear}
            className="w-full rounded-xl border border-red-200 py-2 text-sm text-red-500 transition hover:bg-red-50"
          >
            Clear Conversation
          </button>
        </div>
      </aside>
    </>
  )
}
