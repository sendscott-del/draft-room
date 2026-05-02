import { useState } from 'react'
import type { CountdownState } from '../lib/locks'
import SyncDot from './ui/SyncDot'
import Countdown from './ui/Countdown'

interface HeaderProps {
  syncStatus: 'loading' | 'saved' | 'saving' | 'error'
  countdown: CountdownState
  onStatsUpdated?: () => void
  /** Labels shown above the two scores. Left is always "you"; right is the
   *  leader (or the 2nd-place player when you are the leader). */
  leftLabel?: string
  rightLabel?: string
  /** Pre-computed totals from the same scoring source as the Standings page. */
  leftTotal: number
  rightTotal: number
  hasProjection: boolean
}

/** Studio Talk masthead — navy field with a halftone dot pattern, a red
 *  "DR" brand mark with a gold drop-shadow, the countdown box, and a
 *  two-side scoreboard (You vs. Leader). */
export default function Header({
  syncStatus, countdown, onStatsUpdated,
  leftLabel = 'Scott', rightLabel = 'Ty',
  leftTotal, rightTotal, hasProjection,
}: HeaderProps) {
  const youAreLeading = leftTotal > rightTotal
  const youAreTied = leftTotal === rightTotal
  const rightRole = youAreLeading ? '2nd' : youAreTied ? 'Tied' : 'Leader'
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  const handleUpdateStats = async () => {
    setUpdating(true)
    setUpdateMsg('')
    try {
      const res = await fetch('/api/update-stats')
      const result = await res.json()
      if (result.success) {
        setUpdateMsg(`Updated: ${result.updates.join(', ')}`)
        onStatsUpdated?.()
      } else {
        setUpdateMsg(`Error: ${result.error}`)
      }
    } catch {
      setUpdateMsg('Failed to reach update endpoint')
    }
    setUpdating(false)
    setTimeout(() => setUpdateMsg(''), 5000)
  }

  const youColor   = youAreLeading ? '#D4A24C' : '#F2EAD3'
  const themColor  = !youAreLeading && !youAreTied ? '#D4A24C' : '#F2EAD3'
  const proj = hasProjection ? '~' : ''

  return (
    <header
      style={{
        background: '#0E1B2C',
        color: '#F2EAD3',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '3px solid #C8332C',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Halftone dot pattern overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 1.4px 1.4px, rgba(242,234,211,0.07) 1.1px, transparent 1.4px) 0 0/6px 6px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '18px 18px 16px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto auto',
          gap: 20,
          alignItems: 'center',
          position: 'relative',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div
            aria-hidden
            style={{
              width: 56,
              height: 56,
              background: '#C8332C',
              color: '#F2EAD3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #F2EAD3',
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 0,
              lineHeight: 1,
              boxShadow: '4px 4px 0 #D4A24C',
              transform: 'rotate(-3deg)',
              flexShrink: 0,
            }}
          >
            DR
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="label"
              style={{
                color: '#D4A24C',
                fontSize: 10,
                letterSpacing: '0.28em',
                marginBottom: 3,
              }}
            >
              · The 2026 Season ·
            </div>
            <div
              className="brand-display"
              style={{
                fontSize: 28,
                lineHeight: 0.95,
                color: '#F2EAD3',
              }}
            >
              Draft <span style={{ color: '#D4A24C' }}>Room.</span>
            </div>
            <div
              className="script-italic"
              style={{
                fontSize: 12,
                color: 'rgba(242,234,211,0.65)',
                marginTop: 4,
              }}
            >
              A Talkin' Baseball companion
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <SyncDot status={syncStatus} />
              <button
                onClick={handleUpdateStats}
                disabled={updating}
                className="label"
                style={{
                  background: '#C8332C',
                  border: '1.5px solid #F2EAD3',
                  borderRadius: 0,
                  color: '#F2EAD3',
                  fontSize: 10,
                  padding: '4px 10px',
                  cursor: updating ? 'wait' : 'pointer',
                  letterSpacing: '0.18em',
                  opacity: updating ? 0.6 : 1,
                  fontWeight: 700,
                }}
              >
                {updating ? 'Updating…' : 'Update Stats'}
              </button>
            </div>
            {updateMsg && (
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: updateMsg.startsWith('Error') ? '#E08F89' : '#7DD18C',
                  marginTop: 4,
                }}
              >
                {updateMsg}
              </div>
            )}
          </div>
        </div>

        {/* Countdown */}
        <Countdown state={countdown} />

        {/* Scoreboard */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            border: '1.5px solid #F2EAD3',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <ScoreSide
            role="You"
            name={leftLabel}
            score={`${proj}${leftTotal}`}
            color={youColor}
            leader={youAreLeading}
          />
          <ScoreSide
            role={rightRole}
            name={rightLabel}
            score={`${proj}${rightTotal}`}
            color={themColor}
            leader={!youAreLeading && !youAreTied}
            leftBorder
          />
        </div>
      </div>
    </header>
  )
}

function ScoreSide({
  role, name, score, color, leader, leftBorder = false,
}: {
  role: string
  name: string
  score: string
  color: string
  leader: boolean
  leftBorder?: boolean
}) {
  return (
    <div
      style={{
        padding: '10px 16px',
        textAlign: 'center',
        minWidth: 110,
        position: 'relative',
        borderLeft: leftBorder ? '1.5px solid #F2EAD3' : 'none',
      }}
    >
      <div
        className="label"
        style={{
          fontSize: 9,
          letterSpacing: '0.24em',
          color: leader ? '#D4A24C' : '#F2EAD3',
          marginBottom: 2,
          fontWeight: 700,
        }}
      >
        {role}
      </div>
      <div
        className="label"
        style={{
          fontSize: 11,
          letterSpacing: '0.16em',
          color: 'rgba(242,234,211,0.75)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 140,
        }}
      >
        {name}
      </div>
      <div
        className="brand-display"
        style={{
          fontSize: 40,
          lineHeight: 1,
          color,
          marginTop: 4,
        }}
      >
        {score}
      </div>
    </div>
  )
}
