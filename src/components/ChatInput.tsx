import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (question: string) => void
  disabled: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px'
    }
  }, [value])

  const send = () => {
    const q = value.trim()
    if (!q || disabled) return
    onSend(q)
    setValue('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      padding: '16px 24px 20px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-surface)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        background: 'var(--bg-elevated)',
        border: `1px solid ${disabled ? 'var(--border)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '10px 12px 10px 16px',
        transition: 'border 0.2s',
        boxShadow: disabled ? 'none' : '0 0 0 1px var(--purple-glow)',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder={placeholder || 'Ask anything about this document...'}
          rows={1}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            paddingTop: 2,
          }}
        />
        <button
          onClick={send}
          disabled={disabled || !value.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: disabled || !value.trim()
              ? 'var(--bg-hover)'
              : 'linear-gradient(135deg, var(--lavender-dim), var(--lavender))',
            color: disabled || !value.trim() ? 'var(--text-muted)' : '#0a0a0f',
            cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            flexShrink: 0,
            transition: 'all 0.15s',
            boxShadow: disabled || !value.trim() ? 'none' : '0 0 16px var(--purple-glow-strong)',
          }}
        >
          ↑
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  )
}