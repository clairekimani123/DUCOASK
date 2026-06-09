import { useState, useEffect } from 'react'
import { type Document, listDocuments, deleteDocument, getConversationMessages } from './api/client'
import { type Theme, type Message } from './types'
import { AuthProvider, useAuth } from './AuthContext'
import AuthPage from './AuthPage'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

interface Conversation {
  id: number
  title: string
  document_id: number
  document_name: string
  updated_at: string
}

function AppInner() {
  const { user, loading } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [restoredMessages, setRestoredMessages] = useState<Message[]>([])
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    if (user) {
      listDocuments().then(setDocuments).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    const map: Record<Theme, string> = { dark: '', lavender: 'lavender', purple: 'purple' }
    document.documentElement.setAttribute('data-theme', map[theme])
  }, [theme])

  const handleUpload = (doc: Document) => {
    setDocuments(prev => [doc, ...prev])
    setActiveDoc(doc)
    setActiveConversationId(null)
    setRestoredMessages([])
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file and all its conversations?')) return
    await deleteDocument(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    if (activeDoc?.id === id) {
      setActiveDoc(null)
      setActiveConversationId(null)
      setRestoredMessages([])
    }
  }

  // When user clicks a past conversation in history tab
  const handleSelectConversation = async (conv: Conversation) => {
    // Find the document for this conversation
    const doc = documents.find(d => d.id === conv.document_id)
    if (doc) setActiveDoc(doc)

    setActiveConversationId(conv.id)

    // Load past messages from DB and restore them in the chat
    try {
      const messages = await getConversationMessages(conv.id)
      setRestoredMessages(messages.map(m => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
        streaming: false,
      })))
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--lavender)', fontFamily: 'var(--font-display)', fontSize: 18 }}>Loading...</div>
      </div>
    )
  }

  // Not logged in → show auth page
  if (!user) return <AuthPage />

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
          content: ''; position: fixed;
          top: -30%; left: -10%; width: 60%; height: 60%;
          background: radial-gradient(ellipse, rgba(184,169,245,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Sidebar
          documents={documents}
          activeDoc={activeDoc}
          activeConversationId={activeConversationId}
          onSelect={doc => { setActiveDoc(doc); setActiveConversationId(null); setRestoredMessages([]) }}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onSelectConversation={handleSelectConversation}
          theme={theme}
          onThemeChange={setTheme}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', minWidth: 0 }}>
          <ChatArea
            document={activeDoc}
            activeConversationId={activeConversationId}
            restoredMessages={restoredMessages}
            onConversationCreated={id => setActiveConversationId(id)}
          />
        </main>
      </div>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}