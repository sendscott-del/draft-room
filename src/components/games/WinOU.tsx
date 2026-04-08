import { useState, useMemo } from 'react'
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

  // Projected correct count based on FanGraphs projected wins
  const projStats = useMemo(() => {
    let projCorrect = 0
    let hasProjections = false
    OUL.forEach(t => {
      const s = slot[t.a]
      if (!s?.pick || !(s as any).projected) return
      hasProjections = true
      const proj = (s as any).projected as number
      if ((s.pick === 'over' && proj > t.l) || (s.pick === 'under' && proj < t.l)) {
        projCorrect++
      }
    })
    return { projCorrect, hasProjections }
  }, [slot])

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

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started \u2014 O/U picks are locked.'} />}
      <Pills items={['All 30 teams', '3pts per correct', 'Max 90pts']} />

      {/* Projection banner */}
      {projStats.hasProjections && (
        <div style={{
          background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#ec4899', fontWeight: 700 }}>
              Forecast
            </span>
            <span style={{ marginLeft: 6 }}>FanGraphs projected standings</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#ec4899' }}>
            {projStats.projCorrect}/30 correct — ~{projStats.projCorrect * 3}pts
          </span>
        </div>
      )}

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

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '50px 1fr 112px 50px 50px 50px 22px',
        gap: 4, padding: '4px 10px', marginBottom: 2,
      }}>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Team</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}></span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Pick</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Proj</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Wins</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Pace</span>
        <span></span>
      </div>

      <div>
        {OUL.map(t => {
          const s = slot[t.a] || { pick: '', actual: '' }
          const a = Number(s.actual)
          const proj = (s as any).projected as number | undefined
          const ok = s.pick && s.actual && ((s.pick === 'over' && a > t.l) || (s.pick === 'under' && a < t.l))
          const bad = s.pick && s.actual && !ok && a !== t.l

          // Projection result
          const projOk = s.pick && proj != null && ((s.pick === 'over' && proj > t.l) || (s.pick === 'under' && proj < t.l))
          const projBad = s.pick && proj != null && !projOk

          // Calculate 162-game pace from current wins
          const currentWins = a || 0
          // Get current losses from standings (wins are in actual, approximate games played)
          // Use wins to estimate pace: if 5 wins in ~10 games, pace = 5/10 * 162
          // We don't have losses, so estimate games played from the season date
          const seasonStart = new Date('2026-03-26')
          const now = new Date()
          const daysIntoSeason = Math.max(1, Math.floor((now.getTime() - seasonStart.getTime()) / 86400000))
          const gamesEstimate = Math.min(162, Math.round(daysIntoSeason * 162 / 183)) // ~183 day season
          const pace = gamesEstimate > 0 ? Math.round((currentWins / gamesEstimate) * 162) : 0

          const bg = ok ? 'rgba(34,197,94,0.07)' : bad ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)'
          const bc = ok ? 'rgba(34,197,94,0.25)' : bad ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.09)'
          const overActive = s.pick === 'over'
          const underActive = s.pick === 'under'

          return (
            <div
              key={t.a}
              style={{
                display: 'grid', gridTemplateColumns: '50px 1fr 112px 50px 50px 50px 22px',
                gap: 4, alignItems: 'center', padding: '6px 10px', borderRadius: 7,
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
              {/* Projected wins */}
              <div style={{ textAlign: 'center' }}>
                {proj != null ? (
                  <span style={{
                    fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                    color: projOk ? '#22c55e' : projBad ? '#ef4444' : '#94a3b8',
                  }}>
                    {Math.round(proj)}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#64748b' }}>—</span>
                )}
              </div>
              {/* Current wins */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#f1f5f9' }}>
                  {currentWins || '—'}
                </span>
              </div>
              {/* 162-game pace */}
              <div style={{ textAlign: 'center' }}>
                {currentWins > 0 ? (
                  <span style={{
                    fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                    color: s.pick === 'over' && pace > t.l ? '#22c55e' : s.pick === 'under' && pace < t.l ? '#22c55e' : '#ef4444',
                  }}>
                    {pace}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#64748b' }}>—</span>
                )}
              </div>
              {/* Result */}
              <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: ok ? '#22c55e' : bad ? '#ef4444' : '#64748b' }}>
                {ok ? '\u2705' : bad ? '\u274C' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
