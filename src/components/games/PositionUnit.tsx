import type { PUPick } from '../../types'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS } from '../../data/constants'
import { scorePU } from '../../lib/scoring-per-user'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'

const PU_COLOR = '#a37ed1'
const UNIT_COLORS: Record<string, string> = { 'INF+C': '#5eb774', OF: '#5b8cc7', SP: '#a37ed1', RP: '#f0a531' }

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedPU = (p: PlayerView) => (p.picks?.pu ?? []).length > 0

export default function PositionUnit({ players }: Props) {
  const locked = isLocked('pu')
  const playing = sortPlayersForGame(
    players.filter(p => playedPU(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: scorePU(p.picks.pu ?? []) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedPU(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete — Position Unit picks are locked.'} />}
      <Pills items={['INF+C, OF, SP, RP', 'Points = unit WAR']} />

      <PlayerColumns>
        {playing.map(p => (
          <PlayerPUSection key={p.profile.id} player={p} />
        ))}
      </PlayerColumns>

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Position Unit" />
    </>
  )
}

function PlayerPUSection({ player }: { player: PlayerView & { score: number } }) {
  const picks: PUPick[] = (player.picks.pu ?? []) as PUPick[]
  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={player.score.toFixed(1)} unit="WAR" color={PU_COLOR} editable={false} />
      {(['INF+C', 'OF', 'SP', 'RP'] as const).map(unit => {
        const unitPicks = picks.filter(p => p.unit === unit)
        if (unitPicks.length === 0) return null
        const uc = UNIT_COLORS[unit]
        return (
          <div key={unit} style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: uc, fontWeight: 700, marginBottom: 4 }}>{unit}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
              {unitPicks.map((pick, i) => {
                const war = Number(pick.war) || 0
                return (
                  <Card key={i} style={{ padding: '7px 10px', borderLeft: `3px solid ${uc}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, flex: 1 }}>{pick.team}</span>
                      <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'monospace', color: war > 0 ? uc : COLORS.muted, minWidth: 44, textAlign: 'right' }}>
                        {war > 0 ? war.toFixed(1) : '—'}
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
