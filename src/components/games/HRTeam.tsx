import type { AppData, Player } from '../../types'
import { isLocked } from '../../lib/locks'
import { sHR } from '../../lib/scoring'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { TEAMS, POS } from '../../data/constants'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

export default function HRTeam({ data, setData }: Props) {
  const locked = isLocked('hr')
  const d = data.hr
  const sc = sHR(d)

  const scottTeams = new Set(Object.values(d.Scott).map(s => s.t).filter(Boolean))
  const tyTeams = new Set(Object.values(d.Ty).map(s => s.t).filter(Boolean))

  const updateField = (player: Player, pos: string, field: string, val: string) => {
    setData(prev => {
      const hr = { ...prev.hr }
      hr[player] = { ...hr[player] }
      hr[player][pos] = { ...hr[player][pos], [field]: field === 'hr' ? (Number(val) || 0) : val }
      return { ...prev, hr }
    })
  }

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete \u2014 HR Team picks are locked.'} />}
      <Pills items={['One player per position', 'Team eliminated once drafted', 'Points = total HRs']} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {(['Scott', 'Ty'] as Player[]).map(player => {
          const oth = player === 'Scott' ? tyTeams : scottTeams
          return (
            <div key={player}>
              <div style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 9 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{player}</div>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#ef4444' }}>{sc[player]} HR</div>
              </div>
              {POS.map(pos => {
                const slot = d[player][pos]
                if (!slot) return null
                const conflict = slot.t && oth.has(slot.t)
                const hrs = Number(slot.hr) || 0
                const hasHr = slot.hr !== 0 && String(slot.hr) !== '0'
                const bc = conflict ? '#ef4444' : hasHr ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'

                return (
                  <Card key={pos} borderColor={bc} style={{ padding: '8px 10px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>{pos}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', flex: 1, textAlign: 'center' }}>{slot.p}</span>
                      <span style={{ fontWeight: 900, fontSize: 15, fontFamily: 'monospace', color: hrs > 0 ? '#ef4444' : conflict ? '#ef4444' : '#64748b', minWidth: 36, textAlign: 'right' }}>
                        {hrs > 0 ? `${hrs}HR` : conflict ? '\u26A0' : '\u2014'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <select
                        value={slot.t || ''}
                        disabled={locked}
                        onChange={e => updateField(player, pos, 't', e.target.value)}
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
                        value={slot.hr}
                        placeholder="HRs"
                        onChange={e => updateField(player, pos, 'hr', e.target.value)}
                        style={{
                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                          outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}
