import { useState } from 'react'
import type { AppData, Player } from '../../types'
import { isLocked } from '../../lib/locks'
import { sOU } from '../../lib/scoring'
import { OUL } from '../../data/constants'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function WinOU({ data, setData }: Props) {
  const [tab, setTab] = useState<Player>('Scott')
  const locked = isLocked('ou')
  const d = data.ou
  const sc = sOU(d)
  const slot = d[tab]

  const correct = OUL.filter(t => {
    const s = slot[t.a]
    if (!s || !s.pick || !s.actual) return false
    const a = Number(s.actual)
    return (s.pick === 'over' && a > t.l) || (s.pick === 'under' && a < t.l)
  }).length

  const togglePick = (team: string, pick: 'over' | 'under') => {
    if (locked) return
    setData(prev => {
      const ou = { ...prev.ou }
      ou[tab] = { ...ou[tab] }
      const cur = ou[tab][team].pick
      ou[tab][team] = { ...ou[tab][team], pick: cur === pick ? '' : pick }
      return { ...prev, ou }
    })
  }

  const updateActual = (team: string, val: string) => {
    setData(prev => {
      const ou = { ...prev.ou }
      ou[tab] = { ...ou[tab] }
      ou[tab][team] = { ...ou[tab][team], actual: val }
      return { ...prev, ou }
    })
  }

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started \u2014 O/U picks are locked.'} />}
      <Pills items={['All 30 teams', '3pts per correct', 'Max 90pts']} />

      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <button
            key={p}
            onClick={() => setTab(p)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
              background: tab === p ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderBottom: `2px solid ${tab === p ? '#ec4899' : 'transparent'}`,
              color: tab === p ? '#ec4899' : '#64748b',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            {p} — {sc[p]}pts
          </button>
        ))}
      </div>

      <div style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 7, padding: '7px 12px', marginBottom: 10, fontSize: 13, color: '#ec4899', fontWeight: 700 }}>
        {correct}/30 correct — {correct * 3}pts
      </div>

      <div>
        {OUL.map(t => {
          const s = slot[t.a] || { pick: '', actual: '' }
          const a = Number(s.actual)
          const ok = s.pick && s.actual && ((s.pick === 'over' && a > t.l) || (s.pick === 'under' && a < t.l))
          const bad = s.pick && s.actual && !ok && a !== t.l
          const bg = ok ? 'rgba(34,197,94,0.07)' : bad ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)'
          const bc = ok ? 'rgba(34,197,94,0.25)' : bad ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.09)'
          const overActive = s.pick === 'over'
          const underActive = s.pick === 'under'

          return (
            <div
              key={t.a}
              style={{
                display: 'grid', gridTemplateColumns: '50px 1fr 112px 62px 22px',
                gap: 5, alignItems: 'center', padding: '6px 10px', borderRadius: 7,
                border: `1px solid ${bc}`, marginBottom: 4, background: bg,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 12 }}>{t.a}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.n}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <button
                  onClick={() => togglePick(t.a, 'over')}
                  style={{
                    flex: 1, padding: '3px 0', border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                    borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                    background: overActive ? '#22c55e' : 'rgba(255,255,255,0.08)',
                    color: overActive ? '#fff' : '#64748b',
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  {'\u25B2'}{t.l}
                </button>
                <button
                  onClick={() => togglePick(t.a, 'under')}
                  style={{
                    flex: 1, padding: '3px 0', border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                    borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                    background: underActive ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                    color: underActive ? '#fff' : '#64748b',
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  {'\u25BC'}{t.l}
                </button>
              </div>
              <input
                value={s.actual}
                placeholder="W"
                onChange={e => updateActual(t.a, e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, color: '#f1f5f9', padding: '4px 6px', fontSize: 12,
                  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: ok ? '#22c55e' : bad ? '#ef4444' : '#64748b' }}>
                {ok ? '\u2705' : bad ? '\u274C' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
