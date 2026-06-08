import axios from 'axios'

const BASE = 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE })

export interface Document {
  id: number
  filename: string
  original_name: string
  total_chunks: number
  created_at: string
}

export interface Source {
  chunk_index: number
  preview: string
}

export interface AskResponse {
  answer: string
  conversation_id: string
  document_name: string
  sources: Source[]
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

export const askQuestion = async (
  documentId: number,
  question: string,
  conversationId?: string
): Promise<AskResponse> => {
  const { data } = await api.post('/api/chat/ask', {
    document_id: documentId,
    question,
    conversation_id: conversationId,
  })
  return data
}

// Streaming — returns an EventSource-compatible fetch stream
export const streamQuestion = async (
  documentId: number,
  question: string,
  conversationId: string | undefined,
  onToken: (token: string) => void,
  onDone: (convId: string) => void
) => {
  const response = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      question,
      conversation_id: conversationId,
    }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    const lines = text.split('\n').filter(l => l.startsWith('data:'))
    for (const line of lines) {
      const raw = line.replace('data: ', '').trim()
      if (raw === '[DONE]') { onDone(conversationId || ''); return }
      try {
        const parsed = JSON.parse(raw)
        if (parsed.token) onToken(parsed.token)
      } catch {}
    }
  }
}