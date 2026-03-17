interface ApiKeyModalProps {
  hasKey: boolean
  keyDraft: string
  setKeyDraft: (v: string) => void
  onSave: () => void
  onClose: () => void
}

export default function ApiKeyModal({ hasKey, keyDraft, setKeyDraft, onSave, onClose }: ApiKeyModalProps) {
  return (
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
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
        />
        <div className="mt-4 flex justify-end gap-2">
          {hasKey && (
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            disabled={!keyDraft.trim()}
            onClick={onSave}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
