import type { AppData } from '../../types'
import { sTD } from '../../lib/scoring'
import Card from '../ui/Card'
import { Pills } from '../ui/Pill'
import { TEAMS } from '../../data/constants'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function TradeDeadline({ data, setData }: Props) {
  const d = data.td
  const sc = sTD(d)

  const updateField = (idx: number, field: string, value: string | boolean) => {
    setData(prev => {
      const td = [...prev.td]
      td[idx] = { ...td[idx], [field]: value }
      return { ...prev, td }
    })
  }

  // Color per owner
  const ownerColor = (owner: string) => owner === 'Scott' ? '#22c55e' : '#3b82f6'

  return (
    <>
      <Pills items={['32-pick snake', 'Correct team +10', 'Was traded +5', '2027 ASG or prior award +5']} />

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Scott</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#f59e0b' }}>{sc.Scott}pts</div>
        </div>
        <div style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Ty</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#f59e0b' }}>{sc.Ty}pts</div>
        </div>
      </div>

      {d.map((pick, idx) => {
        let pts = 0
        const bd: string[] = []
        if (pick.player) {
          if (pick.team) { pts += 10; bd.push('Correct team +10') }
          if (pick.traded) { pts += 5; bd.push('Traded +5') }
          if (pick.asg || pick.award) { pts += 5; bd.push('ASG/Award +5') }
        }
        const hasData = !!(pick.player && (pick.team || pick.traded || pick.asg || pick.award))
        const bc = hasData ? (pts > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.09)'
        const oc = ownerColor(pick.owner)

        return (
          <Card key={pick.round} borderColor={bc} style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
              <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                R{pick.round}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: oc, background: `${oc}15`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                {pick.owner}
              </span>
              <input
                value={pick.player}
                placeholder="Player name"
                onChange={e => updateField(idx, 'player', e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              <select
                value={pick.team || ''}
                onChange={e => updateField(idx, 'team', e.target.value)}
                style={{
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                  outline: 'none', width: 100, flexShrink: 0, boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              >
                <option value="">Team...</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{ fontWeight: 900, fontSize: 16, fontFamily: 'monospace', flexShrink: 0, minWidth: 36, textAlign: 'right', color: !hasData ? '#64748b' : pts > 0 ? '#f59e0b' : '#ef4444' }}>
                {hasData ? `${pts}pt` : '\u2014'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, ...(bd.length > 0 ? { marginBottom: 6 } : {}) }}>
              <Toggle label="Was traded (+5)" on={pick.traded} onToggle={() => updateField(idx, 'traded', !pick.traded)} />
              <Toggle label="2027 All-Star (+5)" on={pick.asg} onToggle={() => updateField(idx, 'asg', !pick.asg)} />
              <Toggle label="Prior CY/MVP/RoY (+5)" on={pick.award} onToggle={() => updateField(idx, 'award', !pick.award)} />
            </div>
            {bd.length > 0 && (
              <div style={{ fontSize: 11, color: '#f59e0b', borderTop: '1px solid rgba(255,255,255,0.09)', paddingTop: 5 }}>
                {bd.join(' \u00B7 ')}
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <label
      style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: '#94a3b8' }}
      onClick={e => { e.preventDefault(); onToggle() }}
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
