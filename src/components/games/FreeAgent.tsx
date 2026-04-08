import { useState } from 'react'
import type { AppData, Player } from '../../types'
import { isLocked } from '../../lib/locks'
import { sFA, scoreOnePick, parseActual } from '../../lib/scoring'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { TEAMS } from '../../data/constants'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function FreeAgent({ data, setData }: Props) {
  const [tab, setTab] = useState<Player>('Scott')
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

  const myPicks = d.filter(p => p.owner === tab)

  const updateField = (idx: number, field: string, value: string | boolean) => {
    setData(prev => {
      const fa = [...prev.fa]
      fa[idx] = { ...fa[idx], [field]: value }
      return { ...prev, fa }
    })
  }

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 FA picks are locked.'} />}
      <Pills items={['32-pick snake', 'New team +10, Re-sign +5', 'Contract length +5', 'CY/MVP/RoY/ASG +5', 'After R24 +5', 'Unused team +5']} />

      {/* Player tabs */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {(['Scott', 'Ty'] as Player[]).map(p => (
          <button
            key={p}
            onClick={() => setTab(p)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
              background: tab === p ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderBottom: `2px solid ${tab === p ? '#22c55e' : 'transparent'}`,
              color: tab === p ? '#22c55e' : '#64748b',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            {p} — {sc[p]}pts
          </button>
        ))}
      </div>

      {myPicks.map(pick => {
        const r = pickScores[pick.round] || { pts: 0, breakdown: [] }
        const hasActual = !!pick.actual
        const bc = !hasActual ? 'rgba(255,255,255,0.09)' : r.pts > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'
        const idx = d.indexOf(pick)

        return (
          <Card key={pick.round} borderColor={bc}>
            {/* Top row: round badge, player, points */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
              <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                R{pick.round}
              </span>
              <input
                className="inp"
                value={pick.player}
                placeholder="Player name"
                disabled={locked}
                onChange={e => updateField(idx, 'player', e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                  ...(locked ? { background: 'rgba(255,255,255,0.03)', color: '#64748b', cursor: 'not-allowed' } : {}),
                }}
              />
              <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'monospace', flexShrink: 0, minWidth: 36, textAlign: 'right', color: !hasActual ? '#64748b' : r.pts > 0 ? '#22c55e' : '#ef4444' }}>
                {hasActual ? `${r.pts}pt` : '\u2014'}
              </span>
            </div>

            {/* Team + years row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
              <select
                value={pick.team || ''}
                disabled={locked}
                onChange={e => updateField(idx, 'team', e.target.value)}
                style={{
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                  ...(locked ? { background: '#0f172a', color: '#64748b', cursor: 'not-allowed' } : {}),
                }}
              >
                <option value="">Team...</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                value={pick.years}
                placeholder="Contract years"
                disabled={locked}
                onChange={e => updateField(idx, 'years', e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                  ...(locked ? { background: 'rgba(255,255,255,0.03)', color: '#64748b', cursor: 'not-allowed' } : {}),
                }}
              />
            </div>

            {/* Toggle switches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Toggle label="New team (+10)" on={pick.newTeam} disabled={locked} onToggle={() => updateField(idx, 'newTeam', !pick.newTeam)} />
              <Toggle label="Prior CY/MVP/RoY (+5)" on={pick.award} disabled={locked} onToggle={() => updateField(idx, 'award', !pick.award)} />
              <Toggle label="2026 All-Star (+5)" on={pick.asg} disabled={locked} onToggle={() => updateField(idx, 'asg', !pick.asg)} />
            </div>

            {/* Actual result */}
            {pick.actual && (
              <div style={{ marginTop: 7, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.09)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
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

function Toggle({ label, on, disabled, onToggle }: { label: string; on: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 5, cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12, color: '#94a3b8', opacity: disabled ? 0.5 : 1,
      }}
      onClick={e => { e.preventDefault(); if (!disabled) onToggle() }}
    >
      <div
        style={{
          width: 28, height: 16, borderRadius: 8, position: 'relative',
          background: on ? '#22c55e' : 'rgba(255,255,255,0.15)', cursor: 'pointer',
          flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 2, left: on ? 12 : 2,
            width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
          }}
        />
      </div>
      <span>{label}</span>
    </label>
  )
}
