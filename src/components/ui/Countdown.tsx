import type { CountdownState } from '../../lib/locks'

interface CountdownProps {
  state: CountdownState
}

export default function Countdown({ state }: CountdownProps) {
  const isDone = state.isDone
  return (
    <div
      style={{
        background: isDone ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
        border: `1px solid ${isDone ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.25)'}`,
        borderRadius: 8,
        padding: '7px 14px',
        marginTop: 6,
        textAlign: 'center',
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: 3,
          color: isDone ? '#ef4444' : '#f59e0b',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {state.label}
      </div>
      <div
        style={{
          fontSize: isDone ? 13 : 17,
          fontWeight: isDone ? 700 : 900,
          fontFamily: 'monospace',
          color: isDone ? '#ef4444' : '#fbbf24',
          letterSpacing: 1,
        }}
      >
        {state.time}
      </div>
    </div>
  )
}
