import { useMemo } from 'react'
import type { FAPickPersonal } from '../../types'
import { isLocked } from '../../lib/locks'
import { scoreFA, buildActualsMap } from '../../lib/scoring-per-user'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS } from '../../data/constants'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'
import GameInfo from './GameInfo'

const FA_COLOR = '#0E1B2C' // Studio Talk navy

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedFA = (p: PlayerView) => (p.picks?.fa ?? []).length > 0

export default function FreeAgent({ players }: Props) {
  const locked = isLocked('fa')
  const actualsMap = useMemo(
    () => buildActualsMap(players.map(p => p.picks)),
    [players]
  )
  const playing = sortPlayersForGame(
    players.filter(p => playedFA(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: scoreFA(p.picks.fa ?? [], actualsMap) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedFA(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete — FA picks are locked.'} />}
      <GameInfo gameKey="fa" />
      <Pills items={['New team +10, Re-sign +5', 'Contract length match +5', 'CY/MVP/RoY/ASG +5', 'After R24 +5']} />

      <PlayerColumns>
        {playing.map(p => (
          <PlayerFASection key={p.profile.id} player={p} actualsMap={actualsMap} />
        ))}
      </PlayerColumns>

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Free Agent" />
    </>
  )
}

function PlayerFASection({ player, actualsMap }: { player: PlayerView & { score: number }; actualsMap: Map<string, string> }) {
  const picks: FAPickPersonal[] = (player.picks.fa ?? []) as FAPickPersonal[]
  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={player.score} unit="pts" color={FA_COLOR} editable={false} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {[...picks].sort((a, b) => a.round - b.round).map(pick => {
          const actual = pick.actual || actualsMap.get(pick.player) || ''
          return (
            <Card key={pick.round} style={{ padding: '7px 10px', minHeight: 56, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span className="label" style={{ background: '#D4A24C', color: '#0E1B2C', border: '1.5px solid #0E1B2C', padding: '2px 6px', fontSize: 10, flexShrink: 0, letterSpacing: '0.16em' }}>
                  R{pick.round}
                </span>
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pick.player || <span style={{ color: COLORS.muted }}>—</span>}
                </span>
                {pick.team && <span style={{ fontSize: 11, color: COLORS.muted2, fontFamily: 'monospace', flexShrink: 0 }}>{pick.team}</span>}
                {pick.years && <span style={{ fontSize: 11, color: COLORS.muted2, flexShrink: 0 }}>{pick.years}yr</span>}
              </div>
              <div style={{
                fontSize: 10, color: COLORS.muted, fontFamily: 'monospace',
                marginTop: 4, minHeight: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {actual ? `→ ${actual}` : ' '}
              </div>
            </Card>
          )
        })}
        {picks.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', padding: '8px 10px' }}>No picks yet</div>
        )}
      </div>
    </div>
  )
}
