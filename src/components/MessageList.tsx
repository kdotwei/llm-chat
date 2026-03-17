import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import MarkdownContent from './MarkdownContent'

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
          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200">
                  AI
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-br-sm bg-blue-500 text-white'
                  : 'rounded-bl-sm bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
              }`}>
                {msg.role === 'assistant'
                  ? <MarkdownContent content={msg.content} />
                  : msg.content}
              </div>
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
