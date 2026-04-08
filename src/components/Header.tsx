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

export default function Header({ data, syncStatus, countdown, onStatsUpdated }: HeaderProps) {
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
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
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
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#64748b', textTransform: 'uppercase', marginBottom: 1 }}>
            2026 Season
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
            {'\u26BE'} The Draft Room
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <SyncDot status={syncStatus} />
            <button
              onClick={handleUpdateStats}
              disabled={updating}
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 4,
                color: '#3b82f6',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
                cursor: updating ? 'wait' : 'pointer',
                letterSpacing: 1,
                opacity: updating ? 0.5 : 1,
              }}
            >
              {updating ? '\u23F3' : '\uD83D\uDD04'} {updating ? 'UPDATING...' : 'UPDATE STATS'}
            </button>
          </div>
          {updateMsg && (
            <div style={{ fontSize: 9, color: updateMsg.startsWith('Error') ? '#ef4444' : '#22c55e', marginTop: 2 }}>
              {updateMsg}
            </div>
          )}
        </div>
        <Countdown state={countdown} />
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: sCol }}>
              {hasProj ? '~' : ''}{tot.Scott}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#64748b' }}>SCOTT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: tCol }}>
              {hasProj ? '~' : ''}{tot.Ty}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#64748b' }}>TY</div>
          </div>
        </div>
      </div>
    </div>
  )
}
