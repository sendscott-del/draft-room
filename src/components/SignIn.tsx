import { useState } from 'react'
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from '../lib/supabase'
import { COLORS } from '../data/constants'

type Mode = 'magic' | 'password' | 'signup'

const card: React.CSSProperties = {
  background: COLORS.cardBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 24,
  maxWidth: 420,
  margin: '0 auto',
  color: COLORS.text,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.25)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  color: COLORS.text,
  fontSize: 14,
  marginTop: 4,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: COLORS.muted2,
  letterSpacing: 1,
  textTransform: 'uppercase',
}

function buttonStyle(primary: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    borderRadius: 8,
    border: primary ? 'none' : `1px solid ${COLORS.border}`,
    background: primary ? COLORS.gold : 'transparent',
    color: primary ? '#0f172a' : COLORS.text,
    fontWeight: 700,
    fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: '100%',
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: COLORS.bg }}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, color: COLORS.gold, margin: '0 auto 8px' }}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round">
                <path d="M10 54 L48 16" />
                <path d="M16 10 L54 48" />
              </g>
              <circle cx="48" cy="16" r="5" fill="currentColor" />
              <circle cx="54" cy="48" r="5" fill="currentColor" />
            </svg>
          </div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: COLORS.gold, textTransform: 'uppercase', marginBottom: 2, fontWeight: 700 }}>
            · 2026 Season ·
          </div>
          <div className="brand-display" style={{ fontSize: 36, color: COLORS.text, lineHeight: 1 }}>
            Draft Room
          </div>
          <div style={{ color: COLORS.muted2, fontSize: 12, marginTop: 6, letterSpacing: 1 }}>
            A Talkin' Baseball companion
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          {(['magic', 'password', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setMsg(null) }}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: mode === m ? COLORS.cardBg : 'transparent',
                color: mode === m ? COLORS.text : COLORS.muted2,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m === 'magic' ? 'Magic Link' : m === 'password' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', color: COLORS.muted, fontSize: 11 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          OR
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <button type="button" onClick={googleSignIn} disabled={busy} style={buttonStyle(false, busy)}>
          Continue with Google
        </button>

        {msg && (
          <div style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 8,
            fontSize: 13,
            background: msg.kind === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${msg.kind === 'ok' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: msg.kind === 'ok' ? '#86efac' : '#fca5a5',
          }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  )
}
