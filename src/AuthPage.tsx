import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, username, password)
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(ellipse, rgba(184,169,245,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--lavender)' }}>
            Docu<span style={{ color: 'var(--baby-purple)' }}>Ask</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                background: mode === m ? 'var(--purple-glow-strong)' : 'transparent',
                color: mode === m ? 'var(--lavender)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderBottom: mode === m ? '1px solid var(--lavender)' : '1px solid transparent',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />

          {mode === 'register' && (
            <input
              style={inputStyle}
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          )}

          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />

          {error && (
            <div style={{
              fontSize: 12,
              color: 'var(--color-text-danger, #f87171)',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handle}
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: loading || !email || !password
                ? 'var(--bg-hover)'
                : 'linear-gradient(135deg, var(--lavender-dim), var(--lavender))',
              color: loading || !email || !password ? 'var(--text-muted)' : '#0a0a0f',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: loading ? 'none' : '0 0 20px var(--purple-glow)',
              marginTop: 4,
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}