import { useState, useRef, useEffect } from 'react'
import type { Document } from '../api/client'
import type { Theme } from '../types'
import { uploadDocument, listConversations } from '../api/client'
import { useAuth } from '../AuthContext'

interface Conversation {
  id: number
  title: string
  document_id: number
  document_name: string
  updated_at: string
}

interface SidebarProps {
  documents: Document[]
  activeDoc: Document | null
  activeConversationId: number | null
  onSelect: (doc: Document) => void
  onUpload: (doc: Document) => void
  onDelete: (id: number) => void
  onSelectConversation: (conv: Conversation) => void
  theme: Theme
  onThemeChange: (t: Theme) => void
}

const themes: { id: Theme; label: string; color: string }[] = [
  { id: 'dark', label: 'Black', color: '#0a0a0f' },
  { id: 'lavender', label: 'Lavender', color: '#b8a9f5' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' },
]

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', image: '🖼️', text: '📝', docx: '📋', default: '📁'
}

export default function Sidebar({
  documents, activeDoc, activeConversationId, onSelect, onUpload,
  onDelete, onSelectConversation, theme, onThemeChange
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [tab, setTab] = useState<'docs' | 'history'>('docs')
  const fileRef = useRef<HTMLInputElement>(null)

  // Accepted file types
  const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx"

  useEffect(() => {
    if (tab === 'history') {
      listConversations().then(setConversations).catch(() => {})
    }
  }, [tab])

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const doc = await uploadDocument(file)
      onUpload(doc)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <aside style={{
      width: 260, minWidth: 260, height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 12px', gap: 4,
    }}>
      {/* Logo + user */}
      <div style={{ padding: '4px 6px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--lavender)' }}>
          Docu<span style={{ color: 'var(--baby-purple)' }}>Ask</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>👤 {user?.username}</div>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '2px 8px', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer'
          }}>Logout</button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--lavender)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)', padding: '12px',
          textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'var(--purple-glow)' : 'transparent',
          transition: 'all 0.2s', marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 3 }}>{uploading ? '⏳' : '+'}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {uploading ? 'Processing...' : 'Upload PDF, Image, TXT, DOCX'}
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {(['docs', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '6px', borderRadius: 8, border: 'none',
            background: tab === t ? 'var(--purple-glow-strong)' : 'transparent',
            color: tab === t ? 'var(--lavender)' : 'var(--text-muted)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            {t === 'docs' ? '📁 Documents' : '💬 History'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Documents tab */}
        {tab === 'docs' && (
          <>
            {documents.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px' }}>
                No files yet. Upload one above.
              </div>
            )}
            {documents.map(doc => (
              <div key={doc.id}
                onClick={() => onSelect(doc)}
                style={{
                  padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: activeDoc?.id === doc.id ? 'var(--purple-glow-strong)' : 'transparent',
                  border: `1px solid ${activeDoc?.id === doc.id ? 'var(--border-strong)' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {FILE_ICONS[doc.file_type] || FILE_ICONS.default}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 500,
                    color: activeDoc?.id === doc.id ? 'var(--lavender)' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {doc.original_name.replace(/\.[^.]+$/, '')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {doc.file_type.toUpperCase()} · {doc.total_chunks} chunks
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(doc.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
                  ✕
                </button>
              </div>
            ))}
          </>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <>
            {conversations.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px' }}>
                No conversations yet.
              </div>
            )}
            {conversations.map(conv => (
              <div key={conv.id}
                onClick={() => onSelectConversation(conv)}
                style={{
                  padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: activeConversationId === conv.id ? 'var(--purple-glow-strong)' : 'transparent',
                  border: `1px solid ${activeConversationId === conv.id ? 'var(--border-strong)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  💬 {conv.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {conv.document_name.replace(/\.[^.]+$/, '')}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Theme switcher */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Theme</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {themes.map(t => (
            <button key={t.id} onClick={() => onThemeChange(t.id)} title={t.label}
              style={{
                flex: 1, height: 26, borderRadius: 6, background: t.color,
                border: theme === t.id ? '2px solid var(--lavender)' : '2px solid transparent',
                cursor: 'pointer', transition: 'border 0.15s', position: 'relative',
              }}>
              {theme === t.id && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}