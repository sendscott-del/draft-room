import { AuthProvider, useAuth } from './lib/auth-context'
import SignIn from './components/SignIn'
import LiveAppView from './components/LiveAppView'

function GatedApp() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: '#f5ede0' }}>
        <div style={{ width: 56, height: 56, color: '#e8b54a' }}>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round">
              <path d="M10 54 L48 16" />
              <path d="M16 10 L54 48" />
            </g>
            <circle cx="48" cy="16" r="5" fill="currentColor" />
            <circle cx="54" cy="48" r="5" fill="currentColor" />
          </svg>
        </div>
        <div className="brand-display" style={{ fontSize: 22, letterSpacing: 3 }}>Draft Room</div>
        <div style={{ fontSize: 11, color: '#7a8aa0', letterSpacing: 2 }}>LOADING…</div>
      </div>
    )
  }

  if (!session) return <SignIn />
  return <LiveAppView />
}

export default function App() {
  return (
    <AuthProvider>
      <GatedApp />
    </AuthProvider>
  )
}
