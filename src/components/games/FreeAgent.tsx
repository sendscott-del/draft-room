import type { AppData } from '../../types'
import { isLocked } from '../../lib/locks'
import { sFA, scoreOnePick, parseActual } from '../../lib/scoring'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function FreeAgent({ data }: Props) {
  const locked = isLocked('fa')
  const d = data.fa
  const sc = sFA(d)

  // Build per-pick scores with running seen set
  const seen = new Set<string>()
  const pickScores: Record<number, { pts: number; breakdown: string[] }> = {}
  d.forEach(p => {
    pickScores[p.round] = scoreOnePick(p, seen)
    const at = parseActual(p.actual).team
    if (at) seen.add(at)
  })

  // Color per owner
  const ownerColor = (owner: string) => owner === 'Scott' ? '#22c55e' : '#3b82f6'

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 FA picks are locked.'} />}
      <Pills items={['32-pick snake', 'New team +10, Re-sign +5', 'Contract length +5', 'CY/MVP/RoY/ASG +5', 'After R24 +5', 'Unused team +5']} />

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Scott</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#22c55e' }}>{sc.Scott}pts</div>
        </div>
        <div style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Ty</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#3b82f6' }}>{sc.Ty}pts</div>
        </div>
      </div>

      {d.map(pick => {
        const r = pickScores[pick.round] || { pts: 0, breakdown: [] }
        const hasActual = !!pick.actual
        const oc = ownerColor(pick.owner)
        const bc = !hasActual ? 'rgba(255,255,255,0.09)' : r.pts > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'

        return (
          <Card key={pick.round} borderColor={bc}>
            {/* Top row: round badge, owner, player, points */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                R{pick.round}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: oc, background: `${oc}15`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                {pick.owner}
              </span>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>
                {pick.player || <span style={{ color: '#64748b' }}>---</span>}
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'monospace', flexShrink: 0, minWidth: 36, textAlign: 'right', color: !hasActual ? '#64748b' : r.pts > 0 ? '#22c55e' : '#ef4444' }}>
                {hasActual ? `${r.pts}pt` : '\u2014'}
              </span>
            </div>

            {/* Details row */}
            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
              {pick.team && <span>{pick.team}</span>}
              {pick.years && <span>{pick.years}yr</span>}
              {pick.newTeam && <span style={{ color: '#22c55e' }}>New team</span>}
              {!pick.newTeam && pick.team && <span style={{ color: '#64748b' }}>Re-sign</span>}
              {pick.award && <span style={{ color: '#06b6d4' }}>Award</span>}
              {pick.asg && <span style={{ color: '#f59e0b' }}>ASG</span>}
            </div>

            {/* Actual result */}
            {pick.actual && (
              <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.09)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Actual: <span style={{ color: '#94a3b8' }}>{pick.actual}</span>
                </span>
                {r.breakdown.length > 0 ? (
                  <span style={{ fontSize: 11, color: '#22c55e' }}>{r.breakdown.join(' \u00B7 ')}</span>
                ) : (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>No points</span>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}
