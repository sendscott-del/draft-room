import type { FAPickPersonal } from '../../types'
import { isLocked } from '../../lib/locks'
import { scoreFA } from '../../lib/scoring-per-user'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS } from '../../data/constants'
import { SectionHeader, DidNotPlay, sortPlayersForGame, type PlayerView, type EditMine } from './shared'

const FA_COLOR = '#5eb774'

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedFA = (p: PlayerView) => (p.picks?.fa ?? []).length > 0

export default function FreeAgent({ players }: Props) {
  const locked = isLocked('fa')
  const playing = sortPlayersForGame(
    players.filter(p => playedFA(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: scoreFA(p.picks.fa ?? []) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedFA(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete — FA picks are locked.'} />}
      <Pills items={['New team +10, Re-sign +5', 'Contract length match +5', 'CY/MVP/RoY/ASG +5', 'After R24 +5']} />

      {playing.map(p => (
        <PlayerFASection key={p.profile.id} player={p} />
      ))}

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Free Agent" />
    </>
  )
}

function PlayerFASection({ player }: { player: PlayerView & { score: number } }) {
  const picks: FAPickPersonal[] = (player.picks.fa ?? []) as FAPickPersonal[]
  return (
    <div style={{ marginTop: 12 }}>
      <SectionHeader player={player} score={player.score} unit="pts" color={FA_COLOR} editable={false} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {[...picks].sort((a, b) => a.round - b.round).map(pick => (
          <Card key={pick.round} style={{ padding: '7px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ background: 'rgba(94,183,116,0.12)', color: FA_COLOR, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                R{pick.round}
              </span>
              <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>
                {pick.player || <span style={{ color: COLORS.muted }}>—</span>}
              </span>
              {pick.team && <span style={{ fontSize: 11, color: COLORS.muted2, fontFamily: 'monospace' }}>{pick.team}</span>}
              {pick.years && <span style={{ fontSize: 11, color: COLORS.muted2 }}>{pick.years}yr</span>}
              {pick.actual && (
                <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'monospace' }}>→ {pick.actual}</span>
              )}
            </div>
          </Card>
        ))}
        {picks.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', padding: '8px 10px' }}>No picks yet</div>
        )}
      </div>
    </div>
  )
}
