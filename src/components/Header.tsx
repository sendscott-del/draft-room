import { useState, useMemo } from 'react'
import type { AppData } from '../types'
import type { CountdownState } from '../lib/locks'
import { allScores, getTotals } from '../lib/scoring'
import { projectPlayerTotal } from '../lib/cyProjection'
import { projectAwards } from '../lib/awardsProjection'
import { PLAYERS, OUL } from '../data/constants'
import SyncDot from './ui/SyncDot'
import Countdown from './ui/Countdown'

interface HeaderProps {
  data: AppData
  syncStatus: 'loading' | 'saved' | 'saving' | 'error'
  countdown: CountdownState
  onStatsUpdated?: () => void
  /** Labels shown above the two scores. Defaults to legacy "SCOTT"/"TY". */
  leftLabel?: string
  rightLabel?: string
}

// Projected O/U score using FanGraphs projected wins
function projectedOUScore(ou: AppData['ou']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => {
    OUL.forEach(t => {
      const sl = ou[p]?.[t.a]
      if (!sl?.pick) return
      const proj = (sl as any).projected as number | undefined
      if (proj == null) return
      if ((sl.pick === 'over' && proj > t.l) || (sl.pick === 'under' && proj < t.l)) s[p] += 3
    })
  })
  return s
}

export default function Header({ data, syncStatus, countdown, onStatsUpdated, leftLabel = 'SCOTT', rightLabel = 'TY' }: HeaderProps) {
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const sc = allScores(data)

  // Build projected scores same as Leaderboard
  const cyProj = useMemo(() => ({
    Scott: projectPlayerTotal(data.cy, 'Scott'),
    Ty: projectPlayerTotal(data.cy, 'Ty'),
  }), [data.cy])

  const ouProj = useMemo(() => projectedOUScore(data.ou), [data.ou])

  const awardsOdds = (data as any).awardsOdds || {}
  const awProj = useMemo(() => projectAwards(data.aw, awardsOdds), [data.aw, awardsOdds])

  const displayScores = useMemo(() => {
    const d = { ...sc }
    let hasProjection = false
    if (sc.cy.Scott === 0 && sc.cy.Ty === 0 && (cyProj.Scott > 0 || cyProj.Ty > 0)) {
      d.cy = cyProj
      hasProjection = true
    }
    if (sc.ou.Scott === 0 && sc.ou.Ty === 0 && (ouProj.Scott > 0 || ouProj.Ty > 0)) {
      d.ou = ouProj
      hasProjection = true
    }
    if (sc.aw.Scott === 0 && sc.aw.Ty === 0 && (awProj.totals.Scott > 0 || awProj.totals.Ty > 0)) {
      d.aw = awProj.totals
      hasProjection = true
    }
    return { scores: d, hasProjection }
  }, [sc, cyProj, ouProj, awProj])

  const tot = getTotals(displayScores.scores)
  const hasProj = displayScores.hasProjection
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
