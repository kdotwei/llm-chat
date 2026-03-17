import type { Message, Settings } from './types'

export const API_URL = import.meta.env.VITE_API_URL as string
export const MODELS_URL = API_URL.replace(/\/chat\/completions$/, '/models')
export const LS_KEY = 'llm_chatroom_api_key'
export const LS_SETTINGS_KEY = 'llm_chatroom_settings'

export const DEFAULT_SETTINGS: Settings = {
  model: (import.meta.env.VITE_API_MODEL as string | undefined) ?? '',
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  maxTokens: -1,
  topP: 0.95,
  memoryWindow: 0,
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Build the messages array to send to the API, applying memory window. */
export function buildPayload(
  messages: Message[],
  settings: Settings,
): { role: string; content: string }[] {
  const system = { role: 'system', content: settings.systemPrompt }
  const history =
    settings.memoryWindow > 0
      ? messages.slice(-(settings.memoryWindow * 2))
      : messages
  return [system, ...history.map(({ role, content }) => ({ role, content }))]
}
