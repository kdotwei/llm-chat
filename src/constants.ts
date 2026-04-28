import type { MemoryEntry, Message, Settings } from './types'

export const API_URL = import.meta.env.VITE_API_URL as string
export const MODELS_URL = API_URL.replace(/\/chat\/completions$/, '/models')
export const LS_KEY = 'llm_chatroom_api_key'
export const LS_SETTINGS_KEY = 'llm_chatroom_settings'
export const LS_MEMORY_KEY = 'llm_chatroom_long_term_memory'

export const DEFAULT_SETTINGS: Settings = {
  model: (import.meta.env.VITE_API_MODEL as string | undefined) ?? '',
  visionModel: (import.meta.env.VITE_API_VISION_MODEL as string | undefined) ?? '',
  reasoningModel: (import.meta.env.VITE_API_REASONING_MODEL as string | undefined) ?? '',
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  maxTokens: -1,
  topP: 0.95,
  memoryWindow: 0,
  autoRoutingEnabled: true,
  longTermMemoryEnabled: true,
  maxMemoryItems: 8,
  toolUseEnabled: true,
  enabledMcpServers: ['utilities', 'memory'],
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

export function loadMemories(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_MEMORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MemoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMemories(memories: MemoryEntry[]) {
  localStorage.setItem(LS_MEMORY_KEY, JSON.stringify(memories))
}

export function buildHistorySlice(
  messages: Message[],
  memoryWindow: number,
): Message[] {
  if (memoryWindow <= 0) return messages
  return messages.slice(-(memoryWindow * 2))
}
