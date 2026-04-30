import { useState } from 'react'
import type { CountdownState } from '../lib/locks'
import SyncDot from './ui/SyncDot'
import Countdown from './ui/Countdown'

interface HeaderProps {
  syncStatus: 'loading' | 'saved' | 'saving' | 'error'
  countdown: CountdownState
  onStatsUpdated?: () => void
  /** Labels shown above the two scores. */
  leftLabel?: string
  rightLabel?: string
  /** Pre-computed totals from the same scoring source as the Standings page. */
  leftTotal: number
  rightTotal: number
  hasProjection: boolean
}

export default function Header({
  syncStatus, countdown, onStatsUpdated,
  leftLabel = 'SCOTT', rightLabel = 'TY',
  leftTotal, rightTotal, hasProjection,
}: HeaderProps) {
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  const tot = { Scott: leftTotal, Ty: rightTotal }
  const hasProj = hasProjection
  const leader = tot.Scott > tot.Ty ? 'Scott' : tot.Ty > tot.Scott ? 'Ty' : null
  const sCol = leader === 'Scott' ? '#fbbf24' : '#f1f5f9'
  const tCol = leader === 'Ty' ? '#fbbf24' : '#f1f5f9'

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

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #08121f 0%, rgba(8,18,31,0.92) 100%)',
        borderBottom: '1px solid rgba(232,181,74,0.18)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 0 rgba(232,181,74,0.06), 0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#e8b54a', textTransform: 'uppercase', marginBottom: 1, fontWeight: 700 }}>
            2026 Season
          </div>
          <div className="brand-display" style={{ fontSize: 22, lineHeight: 1, color: '#f5ede0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 22, height: 22, color: '#e8b54a' }}>
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                  <path d="M10 54 L48 16" />
                  <path d="M16 10 L54 48" />
                </g>
                <circle cx="48" cy="16" r="5" fill="currentColor" />
                <circle cx="54" cy="48" r="5" fill="currentColor" />
              </svg>
            </span>
            <span>Draft Room</span>
          </div>
          <div style={{ fontSize: 9, color: '#7a8aa0', marginTop: 1, letterSpacing: 1, fontWeight: 600 }}>
            A Talkin' Baseball companion
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <SyncDot status={syncStatus} />
            <button
              onClick={handleUpdateStats}
              disabled={updating}
              style={{
                background: 'rgba(232,181,74,0.12)',
                border: '1px solid rgba(232,181,74,0.35)',
                borderRadius: 4,
                color: '#e8b54a',
                fontSize: 9,
                fontWeight: 800,
                padding: '3px 8px',
                cursor: updating ? 'wait' : 'pointer',
                letterSpacing: 1.5,
                opacity: updating ? 0.5 : 1,
              }}
            >
              {updating ? '\u23F3' : '\uD83D\uDD04'} {updating ? 'UPDATING...' : 'UPDATE STATS'}
            </button>
          </div>
          {updateMsg && (
            <div style={{ fontSize: 9, color: updateMsg.startsWith('Error') ? '#e45b5b' : '#5eb774', marginTop: 2 }}>
              {updateMsg}
            </div>
          )}
        </div>
        <Countdown state={countdown} />
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="brand-display" style={{ fontSize: 30, lineHeight: 1, color: sCol }}>
              {hasProj ? '~' : ''}{tot.Scott}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#a4b2c6', fontWeight: 700, marginTop: 2 }}>{leftLabel.toUpperCase()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="brand-display" style={{ fontSize: 30, lineHeight: 1, color: tCol }}>
              {hasProj ? '~' : ''}{tot.Ty}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#a4b2c6', fontWeight: 700, marginTop: 2 }}>{rightLabel.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
