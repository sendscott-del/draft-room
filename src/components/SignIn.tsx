import { useState } from 'react'
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from '../lib/supabase'

type Mode = 'magic' | 'password' | 'signup'

const card: React.CSSProperties = {
  background: '#E9DFC2',
  border: '1.5px solid #0E1B2C',
  borderRadius: 0,
  padding: 28,
  maxWidth: 420,
  margin: '0 auto',
  color: '#0E1B2C',
  boxShadow: '6px 6px 0 #0E1B2C',
  position: 'relative',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#F2EAD3',
  border: '1.5px solid #0E1B2C',
  borderRadius: 0,
  color: '#0E1B2C',
  fontSize: 15,
  marginTop: 6,
  boxSizing: 'border-box',
  fontFamily: "'Roboto Slab', serif",
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'Oswald', sans-serif",
  fontSize: 11,
  color: '#4A5466',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontWeight: 600,
}

function buttonStyle(primary: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: '11px 16px',
    borderRadius: 0,
    border: '1.5px solid #0E1B2C',
    background: primary ? '#0E1B2C' : '#F2EAD3',
    color: primary ? '#F2EAD3' : '#0E1B2C',
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: '100%',
    boxShadow: '3px 3px 0 #0E1B2C',
    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
  }
}

export default function SignIn() {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email.trim())
        setMsg({ kind: 'ok', text: `Magic link sent to ${email.trim()}. Check your email.` })
      } else if (mode === 'password') {
        await signInWithPassword(email.trim(), password)
      } else {
        await signUpWithPassword(email.trim(), password, name.trim() || email.split('@')[0])
        setMsg({ kind: 'ok', text: 'Check your email to confirm your account.' })
      }
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  async function googleSignIn() {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Google sign-in failed.' })
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: '#F2EAD3',
      }}
    >
      <div style={card}>
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 6, border: '1px solid #DCCFAA', pointerEvents: 'none' }}
        />

        <div style={{ textAlign: 'center', marginBottom: 22, position: 'relative' }}>
          <div
            aria-hidden
            style={{
              width: 72,
              height: 72,
              background: '#C8332C',
              color: '#F2EAD3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #F2EAD3',
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: 36,
              lineHeight: 1,
              boxShadow: '4px 4px 0 #D4A24C',
              transform: 'rotate(-3deg)',
              margin: '0 auto 14px',
            }}
          >
            DR
          </div>
          <div
            className="label"
            style={{ fontSize: 10, letterSpacing: '0.28em', color: '#D4A24C', marginBottom: 4 }}
          >
            · 2026 Season ·
          </div>
          <div className="brand-display" style={{ fontSize: 38, color: '#0E1B2C', lineHeight: 0.95 }}>
            Draft <span style={{ color: '#D4A24C' }}>Room.</span>
          </div>
          <div
            className="script-italic"
            style={{ color: '#4A5466', fontSize: 13, marginTop: 8 }}
          >
            A Talkin' Baseball companion
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 18,
            border: '1.5px solid #0E1B2C',
            position: 'relative',
          }}
        >
          {(['magic', 'password', 'signup'] as Mode[]).map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setMsg(null) }}
              style={{
                flex: 1,
                padding: '8px 8px',
                borderRadius: 0,
                border: 'none',
                borderLeft: i === 0 ? 'none' : '1.5px solid #0E1B2C',
                background: mode === m ? '#0E1B2C' : '#F2EAD3',
                color: mode === m ? '#F2EAD3' : '#4A5466',
                fontFamily: "'Oswald', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {m === 'magic' ? 'Magic Link' : m === 'password' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
          {mode === 'signup' && (
            <label>
              <div style={labelStyle}>Display name</div>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </label>
          )}
          <label>
            <div style={labelStyle}>Email</div>
            <input style={inputStyle} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          {mode !== 'magic' && (
            <label>
              <div style={labelStyle}>Password</div>
              <input style={inputStyle} type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
          )}
          <button type="submit" disabled={busy} style={buttonStyle(true, busy)}>
            {busy ? '…' : mode === 'magic' ? 'Send magic link' : mode === 'password' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '18px 0',
            color: '#4A5466',
            fontFamily: "'Oswald', sans-serif",
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ flex: 1, height: 1, background: '#DCCFAA' }} />
          Or
          <div style={{ flex: 1, height: 1, background: '#DCCFAA' }} />
        </div>

        <button type="button" onClick={googleSignIn} disabled={busy} style={buttonStyle(false, busy)}>
          Continue with Google
        </button>

        {msg && (
          <div
            className="serif"
            style={{
              marginTop: 16,
              padding: 10,
              borderRadius: 0,
              fontSize: 13,
              background: msg.kind === 'ok' ? '#D4A24C' : '#C8332C',
              border: '1.5px solid #0E1B2C',
              color: msg.kind === 'ok' ? '#0E1B2C' : '#F2EAD3',
            }}
          >
            {msg.text}
          </div>
        )}
      </div>
    </div>
  )
}
