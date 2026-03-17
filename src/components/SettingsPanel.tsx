import type { Settings } from '../types'

interface SettingsPanelProps {
  show: boolean
  settings: Settings
  availableModels: string[]
  patchSettings: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onClose: () => void
  onClear: () => void
}

export default function SettingsPanel({
  show,
  settings,
  availableModels,
  patchSettings,
  onClose,
  onClear,
}: SettingsPanelProps) {
  return (
    <>
      {show && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col bg-white shadow-2xl
        transition-transform duration-200 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
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
            <input
              type="range" min={0} max={2} step={0.01}
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
            <input
              type="range" min={0} max={1} step={0.01}
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

        <div className="border-t border-gray-200 p-4">
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
