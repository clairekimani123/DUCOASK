import { useEffect, useRef, useState } from 'react'
import { type Document } from '../api/client'
import { streamQuestion } from '../api/client'
import { type Message } from '../types'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

interface ChatAreaProps {
  document: Document | null
}

const SUGGESTIONS = [
  'What is this document about?',
  'Summarise the key points',
  'What are the main conclusions?',
  'List any important dates or numbers',
]

export default function ChatArea({ document }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevDocId = useRef<number | null>(null)

  // Reset chat when document changes
  useEffect(() => {
    if (document?.id !== prevDocId.current) {
      setMessages([])
      setConversationId(undefined)
      prevDocId.current = document?.id ?? null
    }
  }, [document])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!document || streaming) return

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    // Add empty streaming assistant message
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    let fullContent = ''

    try {
      await streamQuestion(
        document.id,
        question,
        conversationId,
        // onToken — append each word as it arrives
        (token) => {
          fullContent += token
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          ))
        },
        // onDone — mark streaming complete
        (convId) => {
          setConversationId(convId || conversationId)
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, streaming: false } : m
          ))
          setStreaming(false)
        }
      )
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Something went wrong. Please try again.', streaming: false }
          : m
      ))
      setStreaming(false)
    }
  }

  // Empty state — no document selected
  if (!document) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--purple-glow)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          boxShadow: 'var(--shadow-glow)',
        }}>◈</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--lavender)', marginBottom: 8 }}>
            Ask anything about your documents
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.7 }}>
            Upload a PDF from the sidebar and start a conversation with your document.
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 500, marginTop: 8 }}>
          {SUGGESTIONS.map(s => (
            <div key={s} style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>{s}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Doc header */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-surface)',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--lavender)',
          boxShadow: '0 0 8px var(--lavender)',
        }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {document.original_name.replace('.pdf', '')}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {document.total_chunks} chunks
        </span>
        {conversationId && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
            session active
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 40 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Document ready. Try asking:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 500 }}>
              {SUGGESTIONS.map(s => (
                <button key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    fontSize: 12,
                    color: 'var(--lavender)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--purple-glow)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        disabled={streaming}
        placeholder={`Ask about "${document.original_name.replace('.pdf', '')}"...`}
      />
    </div>
  )
}