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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      /* Mobile responsive */
      .app-layout { display: flex; height: 100vh; overflow: hidden; position: relative; z-index: 1; }
      .main-area { flex: 1; display: flex; flex-direction: column; background: var(--bg-base); min-width: 0; }

      /* Mobile — sidebar hidden by default, chat takes full width */
      @media (max-width: 768px) {
        .sidebar-wrapper {
          position: fixed;
          left: -280px;
          top: 0;
          height: 100vh;
          z-index: 100;
          transition: left 0.3s ease;
          box-shadow: 4px 0 20px rgba(0,0,0,0.5);
        }
        .sidebar-wrapper.open {
          left: 0;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99;
        }
        .sidebar-overlay.open {
          display: block;
        }
        .mobile-menu-btn {
          display: flex !important;
        }
      }
      @media (min-width: 769px) {
        .sidebar-wrapper { position: relative; left: 0 !important; }
        .mobile-menu-btn { display: none !important; }
        .sidebar-overlay { display: none !important; }
      }
    `}</style>

    <div className="app-layout">
      {/* Mobile overlay — clicking it closes sidebar */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          documents={documents}
          activeDoc={activeDoc}
          activeConversationId={activeConversationId}
          onSelect={doc => { setActiveDoc(doc); setActiveConversationId(null); setRestoredMessages([]); setSidebarOpen(false) }}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onSelectConversation={conv => { handleSelectConversation(conv); setSidebarOpen(false) }}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>

      {/* Main chat area */}
      <main className="main-area">
        {/* Mobile top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            style={{
              display: 'none',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              color: 'var(--lavender)',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ☰
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--lavender)' }}>
            Docu<span style={{ color: 'var(--baby-purple)' }}>Ask</span>
          </span>
        </div>

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