import { useEffect, useRef, useState } from 'react'
import type { Message } from '../types'
import MarkdownContent from './MarkdownContent'

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      className="mt-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function formatToolName(name?: string) {
  if (!name) return 'Tool activity'
  if (name === 'browser_search_web') return 'Web search'
  if (name === 'browser_open_url') return 'Opened page'
  if (name === 'memory_search') return 'Memory lookup'
  if (name === 'utilities_time_now') return 'Time check'
  if (name === 'utilities_calculate') return 'Calculator'
  return name.replace(/_/g, ' ')
}

function parseToolContent(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return null
  }
}

function ToolMessageCard({ message }: { message: Message }) {
  const parsed = parseToolContent(message.content)

  if (message.name === 'utilities_time_now' && parsed?.now) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Time Check</div>
        <p>Checked local time: <span className="font-mono text-xs">{String(parsed.now)}</span></p>
      </div>
    )
  }

  if (message.name === 'memory_search' && parsed) {
    const matches = Array.isArray(parsed.matches) ? parsed.matches as Array<{ text?: string }> : []
    return (
      <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 px-4 py-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Memory Lookup</div>
        <p className="mb-2 text-xs opacity-80">Query: {String(parsed.query ?? '')}</p>
        {matches.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {matches.slice(0, 3).map((match, index) => (
              <li key={`${message.id}-${index}`}>{match.text || 'Matched memory'}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-80">No relevant stored memories were found.</p>
        )}
      </div>
    )
  }

  if (message.name === 'browser_search_web' && parsed) {
    const sources = Array.isArray(parsed.sources)
      ? parsed.sources as Array<{ title?: string; url?: string; snippet?: string; source?: string }>
      : []
    const provider = String(parsed.provider ?? 'Unknown provider')
    const resultType = String(parsed.resultType ?? 'empty')
    const online = Boolean(parsed.online)

    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Web Search</div>
        <p className="mb-2 text-xs opacity-80">Query: {String(parsed.query ?? '')}</p>
        <p className="mb-2 text-xs opacity-80">Provider: {provider}</p>
        <p className="rounded-xl bg-white/70 px-3 py-2 text-sm leading-relaxed dark:bg-white/5">
          {String(parsed.summary ?? 'No summary returned.')}
        </p>
        {sources.length > 0 ? (
          <div className="mt-3 space-y-2">
            {sources.slice(0, 4).map((source, index) => (
              <a
                key={`${message.id}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-amber-200 bg-white/80 px-3 py-2 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/60 dark:border-amber-800/60 dark:bg-white/5 dark:hover:border-amber-700 dark:hover:bg-white/10"
              >
                <div className="text-sm font-medium">{source.title || `Source ${index + 1}`}</div>
                {source.snippet && <p className="mt-1 text-xs opacity-80">{source.snippet}</p>}
                <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                  {`來源${index + 1}`}
                </span>
              </a>
            ))}
          </div>
        ) : resultType === 'error' ? (
          <p className="mt-3 text-xs opacity-80">
            The request did not complete successfully, so this looks like a live-network or provider access problem.
          </p>
        ) : online ? (
          <p className="mt-3 text-xs opacity-80">
            The request reached the provider, but it did not return usable article links for this query.
          </p>
        ) : (
          <p className="mt-3 text-xs opacity-80">
            The request did not confirm successful online access.
          </p>
        )}
      </div>
    )
  }

  if (message.name === 'browser_open_url' && parsed?.url) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Opened Page</div>
        <a href={String(parsed.url)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {String(parsed.url)}
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="mb-1 font-semibold uppercase tracking-wide">{formatToolName(message.name)}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
        {message.content}
      </pre>
    </div>
  )
}

function WorkingBubble({ processingStatus }: { processingStatus: string }) {
  return (
    <div className="flex justify-start">
      <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200">
        AI
      </div>
      <div className="flex max-w-[75%] flex-col">
        <div className="mb-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            Working
          </span>
        </div>
        <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 flex-shrink-0">
              <span className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-900/50" />
              <span className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">Request in progress</div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{processingStatus}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  processingStatus: string | null
}

export default function MessageList({ messages, isStreaming, processingStatus }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, processingStatus])

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.length === 0 && !processingStatus && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">Send a message to get started.</p>
        )}

        {messages.map((msg) => {
          if (msg.role === 'assistant' && msg.content === '') return null

          if (msg.role === 'tool') {
            return <ToolMessageCard key={msg.id} message={msg} />
          }

          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200">
                  AI
                </div>
              )}
              {msg.role === 'assistant' ? (
                <div className="flex max-w-[75%] flex-col">
                  {(msg.model || msg.routeLabel) && (
                    <div className="mb-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {msg.model && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                          {msg.model}
                        </span>
                      )}
                      {msg.routeLabel && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                          {msg.routeLabel}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed shadow-sm text-gray-800 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700">
                    <MarkdownContent content={msg.content} />
                  </div>
                  {msg.routeReason && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{msg.routeReason}</p>
                  )}
                  <CopyButton content={msg.content} />
                </div>
              ) : (
                <div className="max-w-[75%] space-y-2">
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {msg.attachments.map((attachment) => (
                        <img
                          key={attachment.id}
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="max-h-44 w-full rounded-2xl object-cover shadow-sm"
                        />
                      ))}
                    </div>
                  )}
                  {msg.content && (
                    <div className="rounded-2xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm leading-relaxed shadow-sm text-white">
                      {msg.content}
                    </div>
                  )}
                </div>
              )}
              {msg.role === 'user' && (
                <div className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  You
                </div>
              )}
            </div>
          )
        })}

        {isStreaming && processingStatus && <WorkingBubble processingStatus={processingStatus} />}

        <div ref={bottomRef} />
      </div>
    </main>
  )
}
