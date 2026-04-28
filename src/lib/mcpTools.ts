import type { MCPServerDefinition, MemoryEntry, Settings } from '../types'
import { searchMemories } from './memory'

interface ToolContext {
  memories: MemoryEntry[]
}

interface FunctionTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

export const MCP_SERVERS: MCPServerDefinition[] = [
  {
    id: 'utilities',
    name: 'Utilities Server',
    description: 'Small helper tools for time and calculation tasks.',
    toolNames: ['utilities_time_now', 'utilities_calculate'],
  },
  {
    id: 'memory',
    name: 'Memory Server',
    description: 'Searches long-term conversation memories stored in the browser.',
    toolNames: ['memory_search'],
  },
  {
    id: 'browser',
    name: 'Browser Server',
    description: 'Opens a URL in a new tab when the assistant needs to hand off browsing.',
    toolNames: ['browser_open_url'],
  },
]

const ALL_TOOLS: FunctionTool[] = [
  {
    type: 'function',
    function: {
      name: 'utilities_time_now',
      description: 'Get the current local time in ISO format.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'utilities_calculate',
      description: 'Evaluate a simple arithmetic expression with numbers, parentheses, and basic operators.',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Arithmetic expression, for example (24 * 7) / 3' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'memory_search',
      description: 'Search the long-term memory store for user facts or prior preferences.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The memory topic to search for.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_open_url',
      description: 'Open a URL in a new browser tab for the user.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Fully qualified HTTP or HTTPS URL.' },
        },
        required: ['url'],
      },
    },
  },
]

export function getEnabledServerDefinitions(settings: Settings): MCPServerDefinition[] {
  return MCP_SERVERS.filter((server) => settings.enabledMcpServers.includes(server.id))
}

export function getEnabledTools(settings: Settings): FunctionTool[] {
  if (!settings.toolUseEnabled) return []

  const enabledToolNames = new Set(
    getEnabledServerDefinitions(settings).flatMap((server) => server.toolNames),
  )
  return ALL_TOOLS.filter((tool) => enabledToolNames.has(tool.function.name))
}

function safeArithmetic(expression: string): number {
  if (!/^[0-9+\-*/().\s%]+$/.test(expression)) {
    throw new Error('Unsupported characters in expression.')
  }

  const result = Function(`"use strict"; return (${expression})`)()
  if (typeof result !== 'number' || Number.isNaN(result)) {
    throw new Error('Expression did not produce a valid number.')
  }

  return result
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<string> {
  switch (name) {
    case 'utilities_time_now':
      return JSON.stringify({ now: new Date().toISOString() })

    case 'utilities_calculate': {
      const expression = String(args.expression ?? '')
      const result = safeArithmetic(expression)
      return JSON.stringify({ expression, result })
    }

    case 'memory_search': {
      const query = String(args.query ?? '')
      const matches = searchMemories(query, context.memories, 5)
      return JSON.stringify({
        query,
        matches: matches.map(({ text, createdAt, lastUsedAt }) => ({ text, createdAt, lastUsedAt })),
      })
    }

    case 'browser_open_url': {
      const url = String(args.url ?? '')
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('Only HTTP and HTTPS URLs are supported.')
      }
      window.open(url, '_blank', 'noopener,noreferrer')
      return JSON.stringify({ opened: true, url })
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
