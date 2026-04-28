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

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
}

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">Send a message to get started.</p>
        )}

        {messages.map((msg) => {
          if (msg.role === 'assistant' && msg.content === '') return null

          if (msg.role === 'tool') {
            return (
              <div key={msg.id} className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                <div className="mb-1 font-semibold uppercase tracking-wide">
                  Tool: {msg.name}
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
                  {msg.content}
                </pre>
              </div>
            )
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

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200">
              AI
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </main>
  )
}
