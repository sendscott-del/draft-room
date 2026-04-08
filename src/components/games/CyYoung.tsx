import { useMemo } from 'react'
import type { AppData, Player } from '../../types'
import { isLocked } from '../../lib/locks'
import { sCY } from '../../lib/scoring'
import { projectCYVotes, projectPlayerTotal } from '../../lib/cyProjection'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import InfoPopup from '../ui/InfoPopup'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function CyYoung({ data }: Props) {
  const locked = isLocked('cy')
  const d = data.cy
  const actualSc = sCY(d)

  // Build projections
  const projections = useMemo(() => {
    const allAL = [...d.Scott.filter(p => p.lg === 'AL'), ...d.Ty.filter(p => p.lg === 'AL')]
    const allNL = [...d.Scott.filter(p => p.lg === 'NL'), ...d.Ty.filter(p => p.lg === 'NL')]
    const alProj = projectCYVotes(allAL)
    const nlProj = projectCYVotes(allNL)
    return new Map([...alProj, ...nlProj])
  }, [d])

  const projTotals = useMemo(() => ({
    Scott: projectPlayerTotal(d, 'Scott'),
    Ty: projectPlayerTotal(d, 'Ty'),
  }), [d])

  // Use projected totals when actual votes are 0
  const displaySc = {
    Scott: actualSc.Scott > 0 ? actualSc.Scott : projTotals.Scott,
    Ty: actualSc.Ty > 0 ? actualSc.Ty : projTotals.Ty,
  }
  const isProjected = actualSc.Scott === 0 && actualSc.Ty === 0

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 Cy Young picks are locked.'} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Pills items={['10 pitchers each', '1 must have 0 prior CY votes', 'Points = official CY votes']} />
        {isProjected && (
          <InfoPopup title="Cy Young Vote Projection">
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>How it works:</strong> Projected votes are estimated using a blend of betting odds and current pitching stats.</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>Betting odds</strong> are converted to implied win probability. A pitcher at +300 odds has a ~25% implied chance of winning.</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>Pitching stats</strong> (ERA, W-L, K, IP) are scored on a 0-100 scale weighted 45% ERA, 25% K/9, 15% W-L, 15% IP.</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>Blending:</strong> Early season the model weights odds more heavily (85/15). As more innings are pitched, stats gain weight up to 60/40 late season.</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>Vote distribution</strong> follows the historical BBWAA curve calibrated from 2025 results. The CY Young uses 7-4-3-2-1 scoring with 30 voters (max 210 per pitcher, 510 total pool per league).</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>2025 calibration:</strong> AL — Skubal 198, Crochet 132, Brown 80, Fried 61. NL — Skenes 210, Sánchez 120, Yamamoto 72, Webb 47.</p>
            <p><strong style={{ color: '#f1f5f9' }}>Winner typically gets ~40%</strong> of the vote pool, 2nd ~25%, 3rd ~15%, 4th ~11%, 5th ~7%.</p>
          </InfoPopup>
        )}
      </div>

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <div key={p} style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{p}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#3b82f6' }}>
              {isProjected ? `~${displaySc[p]}` : displaySc[p]}pts
            </div>
            {isProjected && <div style={{ fontSize: 9, color: '#64748b' }}>projected</div>}
          </div>
        ))}
      </div>

      {(['AL', 'NL'] as const).map(lg => (
        <div key={lg}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, marginTop: 16, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
            {lg} Picks
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['Scott', 'Ty'] as Player[]).map(player => (
              <div key={player}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>{player}</div>
                {d[player].filter(pick => pick.lg === lg).map((pick, i) => {
                  const votes = Number(pick.votes) || 0
                  const proj = projections.get(pick.pitcher)
                  const displayPts = votes > 0 ? votes : (proj?.projectedVotes ?? 0)
                  const usingProj = votes === 0 && displayPts > 0
                  const bc = votes > 0 ? 'rgba(59,130,246,0.4)' : usingProj ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.09)'
                  const stats = pick.stats
                  const liveOdds = pick.liveOdds

                  return (
                    <Card key={i} borderColor={bc}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                          R{pick.round}
                        </span>
                        <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{pick.pitcher}</div>
                        <span style={{ fontWeight: 900, fontSize: 14, fontFamily: 'monospace', flexShrink: 0, textAlign: 'right', color: votes > 0 ? '#3b82f6' : usingProj ? '#64748b' : '#64748b' }}>
                          {usingProj ? `~${displayPts}` : votes > 0 ? `${votes}pt` : '\u2014'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>Draft: {pick.odds}</span>
                        {liveOdds && (
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>Live: {liveOdds}</span>
                        )}
                        {pick.rookie ? <span style={{ color: '#a855f7' }}>{'\u2605'} never-voted</span> : null}
                      </div>
                      {stats && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, display: 'flex', gap: 6, fontFamily: 'monospace' }}>
                          <span style={{ color: parseFloat(stats.era) <= 3.00 ? '#22c55e' : parseFloat(stats.era) <= 4.00 ? '#f59e0b' : '#94a3b8' }}>
                            {stats.era} ERA
                          </span>
                          <span>{stats.w}-{stats.l}</span>
                          <span>{stats.k} K</span>
                          <span>{stats.ip} IP</span>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
