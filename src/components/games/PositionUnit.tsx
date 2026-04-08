import type { AppData, Player } from '../../types'
import { isLocked } from '../../lib/locks'
import { sPU, fmt } from '../../lib/scoring'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

const uColors: Record<string, string> = { 'INF+C': '#22c55e', OF: '#3b82f6', SP: '#a855f7', RP: '#f59e0b' }

export default function PositionUnit({ data }: Props) {
  const locked = isLocked('pu')
  const d = data.pu
  const totWAR = sPU(d)

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 Position Unit picks are locked.'} />}
      <Pills items={['12 teams each', 'INF+C, OF, SP, RP', 'No 2 units same team', 'Points = unit WAR']} />

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <div key={p} style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{p}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#a855f7' }}>{fmt(totWAR[p])} WAR</div>
          </div>
        ))}
      </div>

      {(['INF+C', 'OF', 'SP', 'RP'] as const).map(ut => {
        const uc = uColors[ut]
        return (
          <div key={ut}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, marginTop: 16, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
              {ut} Picks
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['Scott', 'Ty'] as Player[]).map(player => (
                <div key={player}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>{player}</div>
                  {d[player].filter(pick => pick.unit === ut).map((pick, i) => {
                    const war = Number(pick.war) || 0
                    const hasWar = pick.war !== 0 && String(pick.war) !== '0'
                    return (
                      <Card key={i} borderColor={hasWar ? uc : 'rgba(255,255,255,0.09)'} style={{ borderLeft: `3px solid ${uc}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', color: uc, borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                            R{pick.r}
                          </span>
                          <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{pick.team}</div>
                          <span style={{ fontWeight: 900, fontSize: 14, fontFamily: 'monospace', flexShrink: 0, textAlign: 'right', color: war > 0 ? uc : '#64748b' }}>
                            {war > 0 ? `${war.toFixed(1)}` : '\u2014'}
                          </span>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
