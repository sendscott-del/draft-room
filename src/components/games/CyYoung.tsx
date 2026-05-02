import { useMemo } from 'react'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS } from '../../data/constants'
import { scoreCY } from '../../lib/scoring-per-user'
import { projectCYVotes, buildCYPlacementMap } from '../../lib/cyProjection'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'
import GameInfo from './GameInfo'

const CY_COLOR = '#1E4A6B' // Studio Talk deep cyan-blue

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedCY = (p: PlayerView) => (p.picks?.cy ?? []).length > 0

export default function CyYoung({ players }: Props) {
  const locked = isLocked('cy')

  // Field-wide projections (still useful for display: shows projected
  // vote count next to each pitcher).
  const allAL = players.flatMap(p => (p.picks?.cy ?? []).filter(x => x.lg === 'AL'))
  const allNL = players.flatMap(p => (p.picks?.cy ?? []).filter(x => x.lg === 'NL'))
  const projAL = projectCYVotes(allAL)
  const projNL = projectCYVotes(allNL)

  // Field-wide placement points (1st 25 / 2nd 15 / 3rd 10 / 4th-5th 5).
  const allCY = useMemo(() => players.flatMap(p => p.picks?.cy ?? []), [players])
  const placement = useMemo(() => buildCYPlacementMap(allCY), [allCY])

  const playing = sortPlayersForGame(
    players.filter(p => playedCY(p) || p.isCurrentUser)
      .map(p => {
        const score = scoreCY(p.picks.cy ?? [], placement.map)
        return { ...p, score, isProj: placement.isProjection && score > 0 }
      })
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedCY(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete — Cy Young picks are locked.'} />}
      <GameInfo gameKey="cy" />
      <Pills items={['1st 25 · 2nd 15 · 3rd 10 · 4-5 5 (per league)']} />

      <PlayerColumns>
        {playing.map(p => (
          <PlayerCYSection
            key={p.profile.id}
            player={p}
            projAL={projAL}
            projNL={projNL}
            placement={placement.map}
          />
        ))}
      </PlayerColumns>

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Cy Young" />
    </>
  )
}

function PlayerCYSection({ player, projAL, projNL, placement }: {
  player: PlayerView & { score: number; isProj: boolean }
  projAL: ReturnType<typeof projectCYVotes>
  projNL: ReturnType<typeof projectCYVotes>
  placement: Map<string, number>
}) {
  const picks = player.picks.cy ?? []
  const score = player.isProj ? `~${player.score}` : `${player.score}`
  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={score} unit="pts" color={CY_COLOR} editable={false} />
      {(['AL', 'NL'] as const).map(lg => {
        const lgPicks = picks.filter(p => p.lg === lg)
        if (lgPicks.length === 0) return null
        return (
          <div key={lg} style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: COLORS.muted2, fontWeight: 700, marginBottom: 4 }}>{lg}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
              {lgPicks.map((pick, i) => {
                const votes = Number(pick.votes) || 0
                const proj = (pick.lg === 'AL' ? projAL : projNL).get(pick.pitcher)
                const placementPts = placement.get(pick.pitcher) ?? 0
                const voteDisplay = votes > 0 ? `${votes}v` : proj ? `~${proj.projectedVotes}v` : '—'
                return (
                  <Card key={i} style={{ padding: '7px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pick.pitcher}</span>
                      <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'monospace' }}>{voteDisplay}</span>
                      <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'monospace', color: placementPts > 0 ? CY_COLOR : COLORS.muted, minWidth: 36, textAlign: 'right' }}>
                        {placementPts > 0 ? `${placementPts}pt` : '—'}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
      {picks.length === 0 && (
        <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', padding: '8px 10px' }}>No picks yet</div>
      )}
    </div>
  )
}
