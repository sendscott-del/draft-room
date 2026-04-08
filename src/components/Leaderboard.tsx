import { useMemo } from 'react'
import type { AppData } from '../types'
import { GMETA, PLAYERS } from '../data/constants'
import { allScores, getTotals, fmt } from '../lib/scoring'
import { projectPlayerTotal } from '../lib/cyProjection'
import { projectAwards } from '../lib/awardsProjection'
import { OUL } from '../data/constants'
import Card from './ui/Card'

interface LeaderboardProps {
  data: AppData
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

export default function Leaderboard({ data }: LeaderboardProps) {
  const sc = allScores(data)

  // Build display scores: use projections where actuals are 0
  const cyProj = useMemo(() => ({
    Scott: projectPlayerTotal(data.cy, 'Scott'),
    Ty: projectPlayerTotal(data.cy, 'Ty'),
  }), [data.cy])

  const ouProj = useMemo(() => projectedOUScore(data.ou), [data.ou])

  const awardsOdds = (data as any).awardsOdds || {}
  const awProj = useMemo(() => projectAwards(data.aw, awardsOdds), [data.aw, awardsOdds])

  const displayScores = useMemo(() => {
    const d = { ...sc }
    const projected: Record<string, boolean> = {}

    if (sc.cy.Scott === 0 && sc.cy.Ty === 0 && (cyProj.Scott > 0 || cyProj.Ty > 0)) {
      d.cy = cyProj
      projected.cy = true
    }
    if (sc.ou.Scott === 0 && sc.ou.Ty === 0 && (ouProj.Scott > 0 || ouProj.Ty > 0)) {
      d.ou = ouProj
      projected.ou = true
    }
    if (sc.aw.Scott === 0 && sc.aw.Ty === 0 && (awProj.totals.Scott > 0 || awProj.totals.Ty > 0)) {
      d.aw = awProj.totals
      projected.aw = true
    }
    return { scores: d, projected }
  }, [sc, cyProj, ouProj, awProj])

  const displayTot = getTotals(displayScores.scores)
  const hasAnyProjection = Object.keys(displayScores.projected).length > 0
  const leader = displayTot.Scott > displayTot.Ty ? 'Scott' : displayTot.Ty > displayTot.Scott ? 'Ty' : null
  const gap = Math.abs(displayTot.Scott - displayTot.Ty)
  const sCol = leader === 'Scott' ? '#fbbf24' : '#f1f5f9'
  const tCol = leader === 'Ty' ? '#fbbf24' : '#f1f5f9'
  const sShadow = leader === 'Scott' ? '0 0 30px rgba(251,191,36,0.4)' : 'none'
  const tShadow = leader === 'Ty' ? '0 0 30px rgba(251,191,36,0.4)' : 'none'

  return (
    <>
      {/* Big score display */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 60px 1fr',
          alignItems: 'center', gap: 8, padding: '24px 16px', marginBottom: 16,
          background: 'linear-gradient(135deg,rgba(34,197,94,0.07),rgba(59,130,246,0.07))',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: sCol, textShadow: sShadow }}>
            {hasAnyProjection ? '~' : ''}{displayTot.Scott}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#94a3b8', marginTop: 3 }}>SCOTT</div>
          {leader === 'Scott' && <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 2, letterSpacing: 1 }}>{'\u2605'} LEADING</div>}
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 10, letterSpacing: 1 }}>
          VS
          {gap > 0 && leader && <div style={{ fontSize: 9, marginTop: 3 }}>+{gap}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: tCol, textShadow: tShadow }}>
            {hasAnyProjection ? '~' : ''}{displayTot.Ty}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#94a3b8', marginTop: 3 }}>TY</div>
          {leader === 'Ty' && <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 2, letterSpacing: 1 }}>{'\u2605'} LEADING</div>}
        </div>
      </div>

      {hasAnyProjection && (
        <div style={{ textAlign: 'center', fontSize: 9, color: '#64748b', marginTop: -12, marginBottom: 12, letterSpacing: 1 }}>
          ~ includes forecasted CY votes and projected wins
        </div>
      )}

      {/* Section label */}
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, marginTop: 16, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
        Game Breakdown
      </div>

      {/* Per-game cards */}
      {Object.keys(GMETA).map(key => {
        const meta = GMETA[key]
        const gs = displayScores.scores[key as keyof typeof sc] || { Scott: 0, Ty: 0 }
        const isProj = displayScores.projected[key]
        const max = Math.max(gs.Scott, gs.Ty, 1)
        const gl = gs.Scott > gs.Ty ? 'Scott' : gs.Ty > gs.Scott ? 'Ty' : null

        return (
          <Card key={key} style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}>
                {meta.i} {meta.l}{' '}
                {meta.status === 'final' ? (
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '2px 7px' }}>FINAL</span>
                ) : (
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '2px 7px' }}>INTERIM</span>
                )}
                {isProj && (
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '2px 6px' }}>PROJ</span>
                )}
              </span>
              {gl && <span style={{ fontSize: 11, color: meta.c, fontWeight: 700 }}>{'\u25B2'} {gl}</span>}
            </div>
            {PLAYERS.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 40, fontSize: 12, color: '#94a3b8' }}>{p}</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.6s', width: `${Math.round((gs[p] / max) * 100)}%`, background: isProj ? '#3b82f6' : meta.c, opacity: isProj ? 0.6 : 1 }} />
                </div>
                <span style={{ width: 50, fontSize: 13, fontWeight: 800, fontFamily: 'monospace', textAlign: 'right', color: gs[p] > 0 ? (isProj ? '#3b82f6' : meta.c) : '#64748b' }}>
                  {isProj ? `~${fmt(gs[p])}` : fmt(gs[p])}
                </span>
              </div>
            ))}
          </Card>
        )
      })}
    </>
  )
}
