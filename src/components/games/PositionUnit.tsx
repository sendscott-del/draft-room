import { useState } from 'react'
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

export default function PositionUnit({ data, setData }: Props) {
  const [tab, setTab] = useState<Player>('Scott')
  const locked = isLocked('pu')
  const d = data.pu
  const totWAR = sPU(d)

  const updateWar = (i: number, val: string) => {
    setData(prev => {
      const pu = { ...prev.pu }
      const arr = [...pu[tab]]
      arr[i] = { ...arr[i], war: Number(val) || 0 }
      pu[tab] = arr
      return { ...prev, pu }
    })
  }

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 Position Unit picks are locked.'} />}
      <Pills items={['12 teams each', 'INF+C, OF, SP, RP', 'No 2 units same team', 'Points = unit WAR']} />

      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <button
            key={p}
            onClick={() => setTab(p)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
              background: tab === p ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderBottom: `2px solid ${tab === p ? '#a855f7' : 'transparent'}`,
              color: tab === p ? '#a855f7' : '#64748b',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            {p} — {fmt(totWAR[p])} WAR
          </button>
        ))}
      </div>

      {(['INF+C', 'OF', 'SP', 'RP'] as const).map(ut => {
        const uc = uColors[ut]
        return (
          <div key={ut}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, marginTop: 16, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
              {ut} Picks
            </div>
            {d[tab].map((pick, i) => {
              if (pick.unit !== ut) return null
              const war = Number(pick.war) || 0
              const hasWar = pick.war !== 0 && String(pick.war) !== '0'
              return (
                <Card key={i} borderColor={hasWar ? uc : 'rgba(255,255,255,0.09)'} style={{ borderLeft: `3px solid ${uc}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: 'rgba(255,255,255,0.08)', color: uc, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                      R{pick.r}
                    </span>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{pick.team}</div>
                    <input
                      value={pick.war}
                      placeholder="WAR"
                      onChange={e => updateWar(i, e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                        outline: 'none', width: 65, flexShrink: 0, boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                    />
                    <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'monospace', flexShrink: 0, minWidth: 50, textAlign: 'right', color: war > 0 ? uc : '#64748b' }}>
                      {war > 0 ? `${war.toFixed(1)} W` : '\u2014'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
