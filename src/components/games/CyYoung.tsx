import { useState } from 'react'
import type { AppData, Player } from '../../types'
import { isLocked } from '../../lib/locks'
import { sCY } from '../../lib/scoring'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function CyYoung({ data, setData }: Props) {
  const [tab, setTab] = useState<Player>('Scott')
  const locked = isLocked('cy')
  const d = data.cy
  const sc = sCY(d)

  const updateVotes = (i: number, val: string) => {
    setData(prev => {
      const cy = { ...prev.cy }
      const arr = [...cy[tab]]
      arr[i] = { ...arr[i], votes: Number(val) || 0 }
      cy[tab] = arr
      return { ...prev, cy }
    })
  }

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 Cy Young picks are locked.'} />}
      <Pills items={['10 pitchers each', '1 must have 0 prior CY votes', 'Points = official CY votes']} />

      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <button
            key={p}
            onClick={() => setTab(p)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
              background: tab === p ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderBottom: `2px solid ${tab === p ? '#3b82f6' : 'transparent'}`,
              color: tab === p ? '#3b82f6' : '#64748b',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            {p} — {sc[p]}pts
          </button>
        ))}
      </div>

      {(['AL', 'NL'] as const).map(lg => (
        <div key={lg}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, marginTop: 16, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
            {lg} Picks
          </div>
          {d[tab].map((pick, i) => {
            if (pick.lg !== lg) return null
            const votes = Number(pick.votes) || 0
            const hasVotes = pick.votes !== 0 && String(pick.votes) !== '0'
            const bc = hasVotes && votes > 0 ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.09)'
            return (
              <Card key={i} borderColor={bc}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                    R{pick.round}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{pick.pitcher}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {pick.odds}{pick.rookie ? ' \u2605 never-voted pick' : ''}
                    </div>
                  </div>
                  <input
                    value={pick.votes}
                    placeholder="Votes"
                    onChange={e => updateVotes(i, e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                      outline: 'none', width: 70, textAlign: 'right', boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'monospace', flexShrink: 0, minWidth: 40, textAlign: 'right', color: votes > 0 ? '#3b82f6' : '#64748b' }}>
                    {votes > 0 ? `${votes}pt` : '\u2014'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      ))}
    </>
  )
}
