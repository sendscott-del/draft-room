import type { CYPick } from '../../types'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS } from '../../data/constants'
import { scoreCY } from '../../lib/scoring-per-user'
import { projectCYVotes } from '../../lib/cyProjection'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'

const CY_COLOR = '#5b8cc7'

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedCY = (p: PlayerView) => (p.picks?.cy ?? []).length > 0

export default function CyYoung({ players }: Props) {
  const locked = isLocked('cy')

  // Field-wide projections (across all players' picks)
  const allAL = players.flatMap(p => (p.picks?.cy ?? []).filter(x => x.lg === 'AL'))
  const allNL = players.flatMap(p => (p.picks?.cy ?? []).filter(x => x.lg === 'NL'))
  const projAL = projectCYVotes(allAL)
  const projNL = projectCYVotes(allNL)

  function projectedTotal(picks: CYPick[]): number {
    return picks.reduce((sum, p) => {
      const map = p.lg === 'AL' ? projAL : projNL
      return sum + (map.get(p.pitcher)?.projectedVotes ?? 0)
    }, 0)
  }

  const playing = sortPlayersForGame(
    players.filter(p => playedCY(p) || p.isCurrentUser)
      .map(p => {
        const actual = scoreCY(p.picks.cy ?? [])
        const proj = projectedTotal(p.picks.cy ?? [])
        return { ...p, score: actual > 0 ? actual : proj, isProj: actual === 0 && proj > 0 }
      })
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedCY(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete — Cy Young picks are locked.'} />}
      <Pills items={['Pitchers across AL + NL', 'Points = official CY votes']} />

      <PlayerColumns>
        {playing.map(p => (
          <PlayerCYSection key={p.profile.id} player={p} projAL={projAL} projNL={projNL} />
        ))}
      </PlayerColumns>

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Cy Young" />
    </>
  )
}

function PlayerCYSection({ player, projAL, projNL }: {
  player: PlayerView & { score: number; isProj: boolean }
  projAL: ReturnType<typeof projectCYVotes>
  projNL: ReturnType<typeof projectCYVotes>
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
                const display = votes > 0 ? `${votes}pt` : proj ? `~${proj.projectedVotes}` : '—'
                return (
                  <Card key={i} style={{ padding: '7px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, flex: 1 }}>{pick.pitcher}</span>
                      <span style={{ fontSize: 10, color: COLORS.muted }}>{pick.odds || pick.liveOdds || ''}</span>
                      <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'monospace', color: votes > 0 ? CY_COLOR : COLORS.muted, minWidth: 44, textAlign: 'right' }}>
                        {display}
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
