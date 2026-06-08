export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { chunk_index: number; preview: string }[]
  streaming?: boolean
  timestamp: Date
}

export type Theme = 'dark' | 'lavender' | 'purple'