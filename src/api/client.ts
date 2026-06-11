import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE })

// Add auth token to every request automatically
api.interceptors.request.use(config => {
  const saved = localStorage.getItem('docuask_user')
  if (saved) {
    try {
      const user = JSON.parse(saved)
      if (user.token) config.headers.Authorization = `Bearer ${user.token}`
    } catch {}
  }
  return config
})

export interface Document {
  id: number
  filename: string
  original_name: string
  file_type: string
  total_chunks: number
  created_at: string
}

export interface Conversation {
  id: number
  title: string
  document_id: number
  document_name: string
  updated_at: string
}

export interface ConversationMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const uploadDocument = async (file: File): Promise<Document> => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/documents/upload', form)
  return data.document
}

export const listDocuments = async (): Promise<Document[]> => {
  const { data } = await api.get('/api/documents')
  return data
}

export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/api/documents/${id}`)
}

export const listConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get('/api/chat/conversations')
  return data
}

export const getConversationMessages = async (id: number): Promise<ConversationMessage[]> => {
  const { data } = await api.get(`/api/chat/conversations/${id}/messages`)
  return data
}

export const deleteConversation = async (id: number): Promise<void> => {
  await api.delete(`/api/chat/conversations/${id}`)
}

// Streaming with auth token in header
export const streamQuestion = async (
  documentId: number,
  question: string,
  conversationId: number | undefined,
  onToken: (token: string) => void,
  onMeta: (meta: { conversation_id: number; title: string }) => void,
  onDone: () => void,
) => {
  const saved = localStorage.getItem('docuask_user')
  const token = saved ? JSON.parse(saved).token : null

  const response = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      document_id: documentId,
      question,
      conversation_id: conversationId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    const lines = text.split('\n').filter(l => l.startsWith('data:'))

    for (const line of lines) {
      const raw = line.replace('data: ', '').trim()
      if (raw === '[DONE]') { onDone(); return }
      if (raw.startsWith('meta:')) {
        try { onMeta(JSON.parse(raw.replace('meta:', ''))) } catch {}
      } else {
        try {
          const parsed = JSON.parse(raw)
          if (parsed.token) onToken(parsed.token)
        } catch {}
      }
    }
  }
}