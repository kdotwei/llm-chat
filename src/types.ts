export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface Settings {
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number    // -1 = server default / no explicit limit
  topP: number
  memoryWindow: number // 0 = entire history, N = last N turns (1 turn = user+assistant)
}
