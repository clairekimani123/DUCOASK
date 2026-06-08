import { useState, useRef } from 'react'
import { type Document, uploadDocument } from '../api/client'
import { type Theme } from '../types'

interface SidebarProps {
  documents: Document[]
  activeDoc: Document | null
  onSelect: (doc: Document) => void
  onUpload: (doc: Document) => void
  onDelete: (id: number) => void
  theme: Theme
  onThemeChange: (t: Theme) => void
}

const themes: { id: Theme; label: string; color: string }[] = [
  { id: 'dark', label: 'Black', color: '#0a0a0f' },
  { id: 'lavender', label: 'Lavender', color: '#b8a9f5' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' },
]

export default function Sidebar({
  documents, activeDoc, onSelect, onUpload, onDelete, theme, onThemeChange
}: SidebarProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) return alert('Only PDF files supported for now.')
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
      width: 260,
      minWidth: 260,
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      gap: 4,
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 8px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--lavender)', letterSpacing: '-0.5px' }}>
          Docu<span style={{ color: 'var(--baby-purple)' }}>Ask</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>AI Document Assistant</div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--lavender)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--purple-glow)' : 'transparent',
          transition: 'all 0.2s',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 4 }}>{uploading ? '⏳' : '📄'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {uploading ? 'Processing...' : 'Drop PDF or click to upload'}
        </div>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* Document list */}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 6px', marginBottom: 4 }}>
        Documents ({documents.length})
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {documents.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px', lineHeight: 1.6 }}>
            No documents yet.<br />Upload a PDF to get started.
          </div>
        )}
        {documents.map(doc => (
          <div key={doc.id}
            onClick={() => onSelect(doc)}
            style={{
              padding: '9px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: activeDoc?.id === doc.id ? 'var(--purple-glow-strong)' : 'transparent',
              border: `1px solid ${activeDoc?.id === doc.id ? 'var(--border-strong)' : 'transparent'}`,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={e => {
              if (activeDoc?.id !== doc.id)
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={e => {
              if (activeDoc?.id !== doc.id)
                (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>📋</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: activeDoc?.id === doc.id ? 'var(--lavender)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.original_name.replace('.pdf', '')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                {doc.total_chunks} chunks
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(doc.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 2, borderRadius: 4, flexShrink: 0, opacity: 0.6 }}
              title="Delete"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Theme switcher */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Theme</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {themes.map(t => (
            <button key={t.id} onClick={() => onThemeChange(t.id)}
              title={t.label}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 6,
                background: t.color,
                border: theme === t.id ? '2px solid var(--lavender)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'border 0.15s',
                position: 'relative',
              }}
            >
              {theme === t.id && (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>✓</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {themes.map(t => (
            <span key={t.id} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--text-muted)' }}>{t.label}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}