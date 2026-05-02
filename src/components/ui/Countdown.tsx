import type { CountdownState } from '../../lib/locks'

interface CountdownProps {
  state: CountdownState
}

/** Studio Talk countdown box — sits in the masthead. Splits the time
 *  string into D : H : M units with red colons. */
export default function Countdown({ state }: CountdownProps) {
  if (state.isDone) {
    return (
      <div
        style={{
          border: '1.5px solid rgba(242,234,211,0.25)',
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.25)',
          textAlign: 'center',
          minWidth: 200,
        }}
      >
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: '0.24em',
            color: '#D4A24C',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {state.label}
        </div>
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: '#F2EAD3',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {state.time}
        </div>
      </div>
    )
  }

  // state.time is "Xd HHh MMm SSs" (or "HHh MMm SSs"). Split into 3 units
  // for the broadcast scoreboard look (Days · Hrs · Min).
  const m = state.time.match(/^(?:(\d+)d\s*)?(\d{1,2})h\s*(\d{1,2})m/)
  const days = m?.[1] ?? '00'
  const hrs  = (m?.[2] ?? '00').padStart(2, '0')
  const mins = (m?.[3] ?? '00').padStart(2, '0')

  return (
    <div
      style={{
        border: '1.5px solid rgba(242,234,211,0.25)',
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.25)',
        textAlign: 'center',
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: '0.24em',
          color: '#D4A24C',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {state.label}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'flex-end' }}>
        <Unit n={days.padStart(2, '0')} l="Days" />
        <Colon />
        <Unit n={hrs} l="Hrs" />
        <Colon />
        <Unit n={mins} l="Min" />
      </div>
    </div>
  )
}

function Unit({ n, l }: { n: string; l: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 26,
          lineHeight: 1,
          color: '#F2EAD3',
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 600,
          fontSize: 9,
          letterSpacing: '0.18em',
          color: 'rgba(242,234,211,0.55)',
          marginTop: 3,
          textTransform: 'uppercase',
        }}
      >
        {l}
      </div>
    </div>
  )
}

function Colon() {
  return (
    <div
      style={{
        fontFamily: "'Oswald', sans-serif",
        fontWeight: 700,
        fontSize: 22,
        color: '#C8332C',
        paddingBottom: 11,
      }}
    >
      :
    </div>
  )
}
