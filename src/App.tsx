import { AuthProvider, useAuth } from './lib/auth-context'
import SignIn from './components/SignIn'
import LiveAppView from './components/LiveAppView'

function GatedApp() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 14,
          background: '#F2EAD3',
          color: '#0E1B2C',
        }}
      >
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
          }}
        >
          DR
        </div>
        <div className="brand-display" style={{ fontSize: 28, letterSpacing: '0.04em' }}>
          Draft <span style={{ color: '#D4A24C' }}>Room.</span>
        </div>
        <div
          className="label"
          style={{ fontSize: 11, color: '#4A5466', letterSpacing: '0.22em' }}
        >
          Loading…
        </div>
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
