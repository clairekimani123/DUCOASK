import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'

interface AuthUser {
  username: string
  email: string
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load saved token on app start
  useEffect(() => {
    const saved = localStorage.getItem('docuask_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {}
    }
    setLoading(false)
  }, [])

  // Attach token to every axios request automatically
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(config => {
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
      return config
    })
    return () => axios.interceptors.request.eject(interceptor)
  }, [user])

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const { data } = await axios.post(`${BASE}/api/auth/login`, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const authUser = { username: data.username, email: data.email, token: data.access_token }
    setUser(authUser)
    localStorage.setItem('docuask_user', JSON.stringify(authUser))
  }

  const register = async (email: string, username: string, password: string) => {
    const { data } = await axios.post(`${BASE}/api/auth/register`, { email, username, password })
    const authUser = { username: data.username, email: data.email, token: data.access_token }
    setUser(authUser)
    localStorage.setItem('docuask_user', JSON.stringify(authUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('docuask_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}