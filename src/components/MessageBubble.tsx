import { useState } from 'react'
import { type Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10,
      alignItems: 'flex-start',
      animation: 'fadeSlideIn 0.3s ease',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        background: isUser
          ? 'linear-gradient(135deg, var(--lavender-dim), var(--lavender))'
          : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border-strong)',
        boxShadow: isUser ? '0 0 12px var(--purple-glow)' : 'none',
      }}>
        {isUser ? '✦' : '◈'}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          background: isUser
            ? 'linear-gradient(135deg, var(--lavender-dim) 0%, var(--lavender) 100%)'
            : 'var(--bg-elevated)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: isUser ? '#0a0a0f' : 'var(--text-primary)',
          fontSize: 14,
          lineHeight: 1.7,
          fontWeight: isUser ? 500 : 400,
          boxShadow: isUser ? '0 4px 20px var(--purple-glow-strong)' : 'var(--shadow-card)',
          position: 'relative',
        }}>
          {/* Streaming cursor */}
          {message.streaming
            ? <span>{message.content}<span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--lavender)', marginLeft: 2, borderRadius: 1, animation: 'blink 1s infinite' }} /></span>
            : <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          }
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && !message.streaming && (
          <div>
            <button
              onClick={() => setShowSources(v => !v)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 11,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              <span>{showSources ? '▲' : '▼'}</span>
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
            </button>

            {showSources && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {message.sources.map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    borderLeft: '3px solid var(--lavender-dim)',
                  }}>
                    <span style={{ color: 'var(--lavender)', fontWeight: 600 }}>Chunk {s.chunk_index + 1} </span>
                    {s.preview}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: isUser ? 'right' : 'left', paddingInline: 4 }}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}