import { useMemo } from 'react'
import type { AppData, AwardResult } from '../../types'
import { isLocked } from '../../lib/locks'
import { PLAYERS } from '../../data/constants'
import { projectAwards, type AwardProjection } from '../../lib/awardsProjection'
import { useLabels } from '../../lib/labels-context'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import InfoPopup from '../ui/InfoPopup'

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

const PROJ_COLORS: Record<string, string> = {
  winner: '#22c55e',
  finalist: '#f59e0b',
  top10: '#3b82f6',
  none: '#64748b',
}

const PROJ_LABELS: Record<string, string> = {
  winner: 'Winner (25pts)',
  finalist: 'Top 3 (10pts)',
  top10: 'Top 10 (5pts)',
  none: 'Outside Top 10',
}

export default function Awards({ data, setData }: Props) {
  const labels = useLabels()
  const locked = isLocked('aw')
  const d = data.aw

  const updateResult = (player: string, res: string, val: string) => {
    setData(prev => {
      const aw = { ...prev.aw }
      aw[player as 'Scott' | 'Ty'] = { ...aw[player as 'Scott' | 'Ty'], [res]: val }
      return { ...prev, aw }
    })
  }

  const actualTotals = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => {
    CATEGORIES.forEach(([, , res]) => {
      actualTotals[p] += PTS[d[p][res as keyof typeof d.Scott] as string] || 0
    })
  })
  const hasActualResults = actualTotals.Scott > 0 || actualTotals.Ty > 0

  const awardsOdds = (data as any).awardsOdds || {}
  const proj = useMemo(() => projectAwards(d, awardsOdds), [d, awardsOdds])

  const displayTotals = hasActualResults ? actualTotals : proj.totals
  const isProjected = !hasActualResults && (proj.totals.Scott > 0 || proj.totals.Ty > 0)

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started \u2014 Award picks are locked.'} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Pills items={['Winner 25pts', 'Top 3 finalist 10pts', 'Top 10 5pts']} />
        {isProjected && (
          <InfoPopup title="Awards Projection">
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>How it works:</strong> When betting odds are available, they're converted to implied probability to project each pick's finish.</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>With odds:</strong> {'>'}40% = Winner, 20-40% = Top 3, 8-20% = Top 10, {'<'}8% = None.</p>
            <p style={{ marginBottom: 10 }}><strong style={{ color: '#f1f5f9' }}>Without odds:</strong> Picks are ranked against preseason favorites lists. #1 favorite = projected Winner, #2-3 = Top 3, #4-5 = Top 10.</p>
            <p><strong style={{ color: '#f1f5f9' }}>Projected Field</strong> shows who's currently expected to win each award based on odds or preseason rankings.</p>
          </InfoPopup>
        )}
      </div>

      {/* Score header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {PLAYERS.map(p => (
          <div key={p} style={{ textAlign: 'center', padding: '9px 0', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{labels[p]}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#06b6d4' }}>
              {isProjected ? `~${displayTotals[p]}` : displayTotals[p]}pts
            </div>
            {isProjected && <div style={{ fontSize: 9, color: '#64748b' }}>projected</div>}
          </div>
        ))}
      </div>

      {CATEGORIES.map(([label, field, res]) => {
        const fieldData = proj.fields?.[field]

        return (
          <Card key={field} style={{ borderLeft: '3px solid #06b6d4' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginBottom: 7, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
              {label}
            </div>

            {/* Projected field — who's expected to win */}
            {fieldData && !hasActualResults && (
              <div style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontSize: 10, color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {fieldData.winner && (
                    <span><span style={{ color: '#22c55e', fontWeight: 700 }}>Proj Winner:</span> {fieldData.winner}</span>
                  )}
                  {fieldData.top3.length > 1 && (
                    <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>Top 3:</span> {fieldData.top3.slice(1, 3).join(', ')}</span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PLAYERS.map(p => {
                const pickName = d[p][field as keyof typeof d.Scott] as string
                const resultVal = d[p][res as keyof typeof d.Scott] as string
                const ptVal = PTS[resultVal] || 0
                const hasResult = resultVal !== 'none'
                const projection: AwardProjection | undefined = proj[p]?.[field]

                return (
                  <div key={p} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{labels[p]}</div>
                      <div style={{ fontWeight: 900, fontSize: 18, fontFamily: 'monospace', color: ptVal > 0 ? '#06b6d4' : hasResult ? '#ef4444' : '#64748b' }}>
                        {hasResult ? `${ptVal}pt` : projection ? `~${projection.points}pt` : '\u2014'}
                      </div>
                    </div>

                    {/* Player pick */}
                    <div style={{
                      fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 6,
                      padding: '5px 9px', background: 'rgba(255,255,255,0.03)',
                      borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {pickName || <span style={{ color: '#64748b', fontWeight: 400 }}>No pick</span>}
                    </div>

                    {/* Projection */}
                    {projection && pickName && !hasResult && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                        padding: '4px 8px', borderRadius: 5,
                        background: `${PROJ_COLORS[projection.result]}10`,
                        border: `1px solid ${PROJ_COLORS[projection.result]}30`,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: PROJ_COLORS[projection.result] }}>
                          {PROJ_LABELS[projection.result]}
                        </span>
                        {projection.odds && (
                          <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginLeft: 'auto' }}>
                            {projection.odds}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Note */}
                    {projection?.note && pickName && !hasResult && (
                      <div style={{ fontSize: 9, color: '#64748b', marginBottom: 6 }}>
                        {projection.note}
                        {projection.impliedProb ? ` (${projection.impliedProb}%)` : ''}
                      </div>
                    )}

                    {/* Result dropdown */}
                    <select
                      value={resultVal}
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
        )
      })}
    </>
  )
}
