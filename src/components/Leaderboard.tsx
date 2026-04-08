import type { AppData } from '../types'
import { GMETA, PLAYERS } from '../data/constants'
import { allScores, getTotals, fmt } from '../lib/scoring'
import { getProjectedTotals } from '../lib/projectedScores'
import Card from './ui/Card'

interface LeaderboardProps {
  data: AppData
}

export default function Leaderboard({ data }: LeaderboardProps) {
  const sc = allScores(data)
  const tot = getTotals(sc)
  const proj = getProjectedTotals(data)
  const leader = tot.Scott > tot.Ty ? 'Scott' : tot.Ty > tot.Scott ? 'Ty' : null
  const projLeader = proj.Scott > proj.Ty ? 'Scott' : proj.Ty > proj.Scott ? 'Ty' : null
  const gap = Math.abs(tot.Scott - tot.Ty)
  const projGap = Math.abs(proj.Scott - proj.Ty)
  const sCol = leader === 'Scott' ? '#fbbf24' : '#f1f5f9'
  const tCol = leader === 'Ty' ? '#fbbf24' : '#f1f5f9'
  const sShadow = leader === 'Scott' ? '0 0 30px rgba(251,191,36,0.4)' : 'none'
  const tShadow = leader === 'Ty' ? '0 0 30px rgba(251,191,36,0.4)' : 'none'

  const hasProjections = Object.values(proj.breakdown).some(b => b.isProjected)

  return (
    <>
      {/* Big score display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 60px 1fr',
          alignItems: 'center',
          gap: 8,
          padding: '24px 16px',
          marginBottom: hasProjections ? 8 : 16,
          background: 'linear-gradient(135deg,rgba(34,197,94,0.07),rgba(59,130,246,0.07))',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: sCol, textShadow: sShadow }}>
            {tot.Scott}
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
            {tot.Ty}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#94a3b8', marginTop: 3 }}>TY</div>
          {leader === 'Ty' && <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 2, letterSpacing: 1 }}>{'\u2605'} LEADING</div>}
        </div>
      </div>

      {/* Projected standings banner */}
      {hasProjections && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 1fr',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            marginBottom: 16,
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: projLeader === 'Scott' ? '#3b82f6' : '#64748b' }}>
              ~{proj.Scott}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#64748b', marginTop: 2 }}>SCOTT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, letterSpacing: 1, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>
              Forecast
            </div>
            {projGap > 0 && projLeader && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>+{projGap}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: projLeader === 'Ty' ? '#3b82f6' : '#64748b' }}>
              ~{proj.Ty}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#64748b', marginTop: 2 }}>TY</div>
          </div>
        </div>
      )}

      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#64748b',
          marginBottom: 7,
          marginTop: 16,
          paddingBottom: 5,
          borderBottom: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        Game Breakdown
      </div>

      {/* Per-game cards */}
      {Object.keys(GMETA).map(key => {
        const meta = GMETA[key]
        const gs = sc[key as keyof typeof sc] || { Scott: 0, Ty: 0 }
        const pb = proj.breakdown[key]
        const max = Math.max(gs.Scott, gs.Ty, 1)
        const projMax = pb ? Math.max(pb.Scott, pb.Ty, 1) : 1
        const gl = gs.Scott > gs.Ty ? 'Scott' : gs.Ty > gs.Scott ? 'Ty' : null

        return (
          <Card key={key} style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}>
                {meta.i} {meta.l}{' '}
                {meta.status === 'final' ? (
                  <span
                    style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#22c55e',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 10, padding: '2px 7px',
                    }}
                  >
                    FINAL
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#f59e0b',
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 10, padding: '2px 7px',
                    }}
                  >
                    INTERIM
                  </span>
                )}
              </span>
              {gl && <span style={{ fontSize: 11, color: meta.c, fontWeight: 700 }}>{'\u25B2'} {gl}</span>}
            </div>

            {/* Actual scores */}
            {PLAYERS.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 40, fontSize: 12, color: '#94a3b8' }}>{p}</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      transition: 'width 0.6s',
                      width: `${Math.round((gs[p] / max) * 100)}%`,
                      background: meta.c,
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 40, fontSize: 13, fontWeight: 800, fontFamily: 'monospace',
                    textAlign: 'right', color: gs[p] > 0 ? meta.c : '#64748b',
                  }}
                >
                  {fmt(gs[p])}
                </span>
              </div>
            ))}

            {/* Projected scores (if different from actual) */}
            {pb?.isProjected && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700, marginBottom: 4 }}>
                  Forecast
                </div>
                {PLAYERS.map(p => (
                  <div key={`proj-${p}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ width: 40, fontSize: 11, color: '#64748b' }}>{p}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          width: `${Math.round((pb[p] / projMax) * 100)}%`,
                          background: '#3b82f6',
                          opacity: 0.5,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 40, fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                        textAlign: 'right', color: '#3b82f6',
                      }}
                    >
                      ~{fmt(pb[p])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}
