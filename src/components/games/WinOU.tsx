import { isLocked } from '../../lib/locks'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS, OUL } from '../../data/constants'
import { scoreOU } from '../../lib/scoring-per-user'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'

const OU_COLOR = '#d4669d'

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedOU = (p: PlayerView) =>
  !!p.picks?.ou && Object.values(p.picks.ou).some(s => !!s?.pick)

export default function WinOU({ players, onEditMine }: Props) {
  const locked = isLocked('ou')
  const playing = sortPlayersForGame(
    players.filter(p => playedOU(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: scoreOU(p.picks.ou ?? {}) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedOU(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started — O/U picks are locked.'} />}
      <Pills items={['All 30 teams', '3 pts per correct']} />
      <PlayerColumns>
        {playing.map(p => (
          <PlayerOUSection
            key={p.profile.id}
            player={p}
            editable={p.isCurrentUser && !locked}
            onEdit={p.isCurrentUser ? onEditMine : undefined}
          />
        ))}
      </PlayerColumns>
      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Win O/U" />
    </>
  )
}

function PlayerOUSection({ player, editable, onEdit }: {
  player: PlayerView & { score: number }
  editable: boolean
  onEdit?: EditMine
}) {
  const ou = player.picks.ou ?? {}

  function setPick(team: string, pick: 'over' | 'under' | '') {
    if (!onEdit) return
    onEdit(mine => ({
      ...mine,
      ou: { ...(mine.ou ?? {}), [team]: { ...(mine.ou?.[team] ?? { pick: '', actual: '' }), pick } },
    }))
  }

  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={player.score} unit="pts" color={OU_COLOR} editable={editable} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {OUL.map(t => {
          const slot = ou[t.a] ?? { pick: '', actual: '' }
          const isOver = slot.pick === 'over'
          const isUnder = slot.pick === 'under'
          return (
            <div key={t.a} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: 6,
              padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 5,
              border: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800 }}>{t.a}</span>
              <span style={{ fontSize: 10, color: COLORS.muted2 }}>{t.l}</span>
              {editable ? (
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => setPick(t.a, isOver ? '' : 'over')}
                    style={{
                      background: isOver ? '#5eb774' : 'rgba(255,255,255,0.06)',
                      color: isOver ? '#0c1a2c' : COLORS.muted2,
                      border: 'none', borderRadius: 3, padding: '2px 6px',
                      fontSize: 9, fontWeight: 800, cursor: 'pointer',
                    }}
                  >▲</button>
                  <button
                    type="button"
                    onClick={() => setPick(t.a, isUnder ? '' : 'under')}
                    style={{
                      background: isUnder ? '#5b8cc7' : 'rgba(255,255,255,0.06)',
                      color: isUnder ? '#0c1a2c' : COLORS.muted2,
                      border: 'none', borderRadius: 3, padding: '2px 6px',
                      fontSize: 9, fontWeight: 800, cursor: 'pointer',
                    }}
                  >▼</button>
                </div>
              ) : (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: isOver ? '#5eb774' : isUnder ? '#5b8cc7' : COLORS.muted,
                  background: isOver ? 'rgba(94,183,116,0.15)' : isUnder ? 'rgba(91,140,199,0.15)' : 'transparent',
                  borderRadius: 3, padding: '1px 6px',
                }}>
                  {isOver ? '▲' : isUnder ? '▼' : '—'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
