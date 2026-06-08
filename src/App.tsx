import { useState, useEffect } from 'react'
import { type Document, listDocuments, deleteDocument } from './api/client'
import { type Theme } from './types'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    listDocuments().then(setDocuments).catch(() => {})
  }, [])

  useEffect(() => {
    const map: Record<Theme, string> = { dark: '', lavender: 'lavender', purple: 'purple' }
    document.documentElement.setAttribute('data-theme', map[theme])
  }, [theme])

  const handleUpload = (doc: Document) => {
    setDocuments(prev => [doc, ...prev])
    setActiveDoc(doc)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document and all its data?')) return
    await deleteDocument(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    if (activeDoc?.id === id) setActiveDoc(null)
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        body::before {
          content: '';
          position: fixed;
          top: -30%; left: -10%;
          width: 60%; height: 60%;
          background: radial-gradient(ellipse, rgba(184,169,245,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        body::after {
          content: '';
          position: fixed;
          bottom: -20%; right: -10%;
          width: 50%; height: 50%;
          background: radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Sidebar
          documents={documents}
          activeDoc={activeDoc}
          onSelect={setActiveDoc}
          onUpload={handleUpload}
          onDelete={handleDelete}
          theme={theme}
          onThemeChange={setTheme}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', minWidth: 0 }}>
          <ChatArea document={activeDoc} />
        </main>
      </div>
    </>
  )
}