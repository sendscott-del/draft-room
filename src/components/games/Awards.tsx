import type { AppData, AwardResult } from '../../types'
import { isLocked } from '../../lib/locks'
import { PLAYERS } from '../../data/constants'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'

interface Props {
  data: AppData
  setData: (fn: (d: AppData) => AppData) => void
}

const PTS: Record<string, number> = { winner: 25, finalist: 10, top10: 5, none: 0 }
const resultOpts = [
  { v: 'none', l: '\u2014 Result \u2014' },
  { v: 'winner', l: 'Winner (25pts)' },
  { v: 'finalist', l: 'Top 3 (10pts)' },
  { v: 'top10', l: 'Top 10 (5pts)' },
]

const CATEGORIES: [string, string, string][] = [
  ['AL MVP', 'alMVP', 'alMVPR'],
  ['NL MVP', 'nlMVP', 'nlMVPR'],
  ['AL Rookie of Year', 'alROY', 'alROYR'],
  ['NL Rookie of Year', 'nlROY', 'nlROYR'],
  ['AL Cy Young', 'alCY', 'alCYR'],
  ['NL Cy Young', 'nlCY', 'nlCYR'],
  ['AL Manager of Year', 'alMGR', 'alMGRR'],
  ['NL Manager of Year', 'nlMGR', 'nlMGRR'],
]

export default function Awards({ data, setData }: Props) {
  const locked = isLocked('aw')
  const d = data.aw

  const updateResult = (player: string, res: string, val: string) => {
    setData(prev => {
      const aw = { ...prev.aw }
      aw[player as 'Scott' | 'Ty'] = { ...aw[player as 'Scott' | 'Ty'], [res]: val }
      return { ...prev, aw }
    })
  }

  // Calculate totals
  const totals = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => {
    CATEGORIES.forEach(([, , res]) => {
      totals[p] += PTS[d[p][res as keyof typeof d.Scott] as string] || 0
    })
  })

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started \u2014 Award picks are locked.'} />}
      <Pills items={['Winner 25pts', 'Top 3 finalist 10pts', 'Top 10 5pts', 'MVP \u00B7 RoY \u00B7 Cy Young \u00B7 Manager of Year']} />

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {PLAYERS.map(p => (
          <div key={p} style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{p}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#06b6d4' }}>{totals[p]}pts</div>
          </div>
        ))}
      </div>

      {CATEGORIES.map(([label, field, res]) => (
        <Card key={field} style={{ borderLeft: '3px solid #06b6d4' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, marginTop: 0, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
            {label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PLAYERS.map(p => {
              const pickName = d[p][field as keyof typeof d.Scott] as string
              const ptVal = PTS[d[p][res as keyof typeof d.Scott] as string] || 0
              const hasResult = d[p][res as keyof typeof d.Scott] !== 'none'
              return (
                <div key={p} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{p}</div>
                    <div style={{ fontWeight: 900, fontSize: 18, fontFamily: 'monospace', color: ptVal > 0 ? '#06b6d4' : hasResult ? '#ef4444' : '#64748b' }}>
                      {hasResult ? `${ptVal}pt` : '\u2014'}
                    </div>
                  </div>
                  {/* Player pick name (read-only) */}
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 6,
                    padding: '5px 9px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {pickName || <span style={{ color: '#64748b', fontWeight: 400 }}>No pick</span>}
                  </div>
                  {/* Result dropdown (editable for end-of-season entry) */}
                  <select
                    value={d[p][res as keyof typeof d.Scott] as string}
                    onChange={e => updateResult(p, res, e.target.value as AwardResult)}
                    style={{
                      background: '#1e293b', border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 6, color: '#f1f5f9', padding: '5px 9px', fontSize: 13,
                      outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  >
                    {resultOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </>
  )
}
