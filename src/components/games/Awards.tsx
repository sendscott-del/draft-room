import { useMemo } from 'react'
import type { AwardPicks, AwardResult, UserAppData } from '../../types'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS } from '../../data/constants'
import { scoreAW } from '../../lib/scoring-per-user'
import { projectAwards } from '../../lib/awardsProjection'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'

const EMPTY_AWARDS: AwardPicks = {
  alMVP: '', nlMVP: '', alROY: '', nlROY: '', alCY: '', nlCY: '', alMGR: '', nlMGR: '',
  alMVPR: 'none', nlMVPR: 'none', alROYR: 'none', nlROYR: 'none',
  alCYR: 'none', nlCYR: 'none', alMGRR: 'none', nlMGRR: 'none',
}

const AW_COLOR = '#39a9bd'

const CATEGORIES: Array<[label: string, pickKey: keyof AwardPicks, resultKey: keyof AwardPicks]> = [
  ['AL MVP', 'alMVP', 'alMVPR'],
  ['NL MVP', 'nlMVP', 'nlMVPR'],
  ['AL ROY', 'alROY', 'alROYR'],
  ['NL ROY', 'nlROY', 'nlROYR'],
  ['AL Cy Young', 'alCY', 'alCYR'],
  ['NL Cy Young', 'nlCY', 'nlCYR'],
  ['AL Mgr', 'alMGR', 'alMGRR'],
  ['NL Mgr', 'nlMGR', 'nlMGRR'],
]

const RESULT_OPTS: Array<{ v: AwardResult; l: string }> = [
  { v: 'none', l: '— Result —' },
  { v: 'winner', l: 'Winner (25)' },
  { v: 'finalist', l: 'Top 3 (10)' },
  { v: 'top10', l: 'Top 10 (5)' },
]

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedAW = (p: PlayerView) =>
  !!p.picks?.aw && CATEGORIES.some(([, pickKey]) => !!p.picks.aw?.[pickKey])

export default function Awards({ players, onEditMine }: Props) {
  const locked = isLocked('aw')

  // Pull live betting odds (replicated to every picks blob by update-stats)
  // from the first player that has them. Fall back to preseason favorites
  // inside projectAwards when no odds are available.
  const awardsOdds = useMemo(() => {
    for (const p of players) {
      const odds = (p.picks as UserAppData & { awardsOdds?: Record<string, Record<string, string>> })?.awardsOdds
      if (odds && Object.keys(odds).length > 0) return odds
    }
    return {}
  }, [players])

  function projectedTotal(aw: AwardPicks | undefined): number {
    if (!aw) return 0
    const proj = projectAwards({ Scott: aw, Ty: EMPTY_AWARDS }, awardsOdds)
    return proj.totals.Scott
  }

  const playing = sortPlayersForGame(
    players.filter(p => playedAW(p) || p.isCurrentUser)
      .map(p => {
        const actual = scoreAW(p.picks.aw)
        const proj = projectedTotal(p.picks.aw)
        return { ...p, score: actual > 0 ? actual : proj, isProj: actual === 0 && proj > 0 }
      })
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedAW(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started — Award picks are locked.'} />}
      <Pills items={['Winner 25 / Top 3 10 / Top 10 5']} />
      <PlayerColumns>
        {playing.map(p => (
          <PlayerAWSection
            key={p.profile.id}
            player={p}
            editable={p.isCurrentUser && !locked}
            onEdit={p.isCurrentUser ? onEditMine : undefined}
          />
        ))}
      </PlayerColumns>
      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Awards" />
    </>
  )
}

function PlayerAWSection({ player, editable, onEdit }: {
  player: PlayerView & { score: number; isProj: boolean }
  editable: boolean
  onEdit?: EditMine
}) {
  const aw = player.picks.aw

  function setResult(resultKey: keyof AwardPicks, val: AwardResult) {
    if (!onEdit) return
    onEdit(mine => ({ ...mine, aw: { ...mine.aw, [resultKey]: val } }))
  }

  const scoreLabel = player.isProj ? `~${player.score}` : `${player.score}`
  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={scoreLabel} unit="pts" color={AW_COLOR} editable={editable} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {CATEGORIES.map(([label, pickKey, resultKey]) => {
          const pickName = (aw?.[pickKey] as string) ?? ''
          const result = (aw?.[resultKey] as AwardResult) ?? 'none'
          return (
            <Card key={pickKey} style={{ padding: '7px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: COLORS.muted2, fontWeight: 700, width: 90, flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: 12, flex: 1 }}>
                  {pickName || <span style={{ color: COLORS.muted }}>—</span>}
                </span>
                {editable && pickName ? (
                  <select value={result} onChange={e => setResult(resultKey, e.target.value as AwardResult)} style={{ background: '#1e293b', border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, padding: '2px 6px', fontSize: 11, outline: 'none' }}>
                    {RESULT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : pickName ? (
                  <span style={{ fontSize: 10, color: AW_COLOR }}>{result === 'none' ? '—' : RESULT_OPTS.find(o => o.v === result)?.l}</span>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
