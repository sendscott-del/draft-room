import { useMemo } from 'react'
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

export default function WinOU({ data }: Props) {
  const locked = isLocked('ou')
  const d = data.ou
  const sc = sOU(d)

  // Projected correct counts
  const projStats = useMemo(() => {
    const result: Record<string, { projCorrect: number; hasProjections: boolean }> = {}
    for (const p of ['Scott', 'Ty'] as Player[]) {
      let projCorrect = 0
      let hasProjections = false
      OUL.forEach(t => {
        const s = d[p]?.[t.a]
        if (!s?.pick || !(s as any).projected) return
        hasProjections = true
        const proj = (s as any).projected as number
        if ((s.pick === 'over' && proj > t.l) || (s.pick === 'under' && proj < t.l)) {
          projCorrect++
        }
      })
      result[p] = { projCorrect, hasProjections }
    }
    return result
  }, [d])

  const hasAnyProjections = projStats.Scott.hasProjections || projStats.Ty.hasProjections

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started \u2014 O/U picks are locked.'} />}
      <Pills items={['All 30 teams', '3pts per correct', 'Max 90pts']} />

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <div key={p} style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{p}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#ec4899' }}>{sc[p]}pts</div>
            {projStats[p].hasProjections && (
              <div style={{ fontSize: 9, color: '#64748b' }}>
                Proj: {projStats[p].projCorrect}/30 correct (~{projStats[p].projCorrect * 3}pts)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Projection banner */}
      {hasAnyProjections && (
        <div style={{
          background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)',
          borderRadius: 8, padding: '6px 12px', marginBottom: 10,
          fontSize: 9, color: '#94a3b8', textAlign: 'center', letterSpacing: 1,
        }}>
          FanGraphs projected standings included
        </div>
      )}

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr 80px 80px 44px 44px 44px',
        gap: 4, padding: '4px 10px', marginBottom: 2,
      }}>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Team</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}></span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Scott</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Ty</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Proj</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Wins</span>
        <span style={{ fontSize: 8, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Pace</span>
      </div>

      <div>
        {OUL.map(t => {
          const sSlot = d.Scott?.[t.a] || { pick: '', actual: '' }
          const tSlot = d.Ty?.[t.a] || { pick: '', actual: '' }
          const a = Number(sSlot.actual) || 0
          const proj = (sSlot as any).projected as number | undefined

          // Calculate pace
          const seasonStart = new Date('2026-03-26')
          const now = new Date()
          const daysIntoSeason = Math.max(1, Math.floor((now.getTime() - seasonStart.getTime()) / 86400000))
          const gamesEstimate = Math.min(162, Math.round(daysIntoSeason * 162 / 183))
          const pace = gamesEstimate > 0 && a > 0 ? Math.round((a / gamesEstimate) * 162) : 0

          // Row background based on if any actual results exist
          const hasResult = !!sSlot.actual
          const bg = hasResult ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'

          return (
            <div
              key={t.a}
              style={{
                display: 'grid', gridTemplateColumns: '44px 1fr 80px 80px 44px 44px 44px',
                gap: 4, alignItems: 'center', padding: '5px 10px', borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.09)', marginBottom: 3, background: bg,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 11 }}>{t.a}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.n} <span style={{ color: '#64748b', fontSize: 10 }}>{t.l}</span></span>

              {/* Scott's pick */}
              {renderPickCell(sSlot, t, a, proj)}

              {/* Ty's pick */}
              {renderPickCell(tSlot, t, a, proj)}

              {/* Projected wins */}
              <div style={{ textAlign: 'center' }}>
                {proj != null ? (
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>
                    {Math.round(proj)}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: '#64748b' }}>{'\u2014'}</span>
                )}
              </div>
              {/* Current wins */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#f1f5f9' }}>
                  {a || '\u2014'}
                </span>
              </div>
              {/* Pace */}
              <div style={{ textAlign: 'center' }}>
                {pace > 0 ? (
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>
                    {pace}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: '#64748b' }}>{'\u2014'}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function renderPickCell(
  slot: { pick: string; actual: string },
  t: { l: number },
  actual: number,
  proj: number | undefined,
) {
  if (!slot.pick) {
    return <div style={{ textAlign: 'center', fontSize: 10, color: '#64748b' }}>{'\u2014'}</div>
  }

  const isOver = slot.pick === 'over'
  const hasActual = !!slot.actual
  const ok = hasActual && ((isOver && actual > t.l) || (!isOver && actual < t.l))
  const bad = hasActual && !ok && actual !== t.l
  const projOk = !hasActual && proj != null && ((isOver && proj > t.l) || (!isOver && proj < t.l))
  const projBad = !hasActual && proj != null && !projOk

  const bgColor = ok ? '#22c55e' : bad ? '#ef4444' : projOk ? 'rgba(34,197,94,0.3)' : projBad ? 'rgba(239,68,68,0.2)' : isOver ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)'
  const textColor = ok ? '#fff' : bad ? '#fff' : projOk ? '#22c55e' : projBad ? '#ef4444' : isOver ? '#22c55e' : '#3b82f6'

  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontWeight: 700, background: bgColor, color: textColor,
      }}>
        {isOver ? '\u25B2' : '\u25BC'}{t.l}
        {ok ? ' \u2705' : bad ? ' \u274C' : ''}
      </span>
    </div>
  )
}
