import { isLocked } from '../../lib/locks'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { OUL } from '../../data/constants'
import { scoreOU } from '../../lib/scoring-per-user'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView, type EditMine } from './shared'
import GameInfo from './GameInfo'

const OU_COLOR = '#C8332C' // Studio Talk studio red

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
      <GameInfo gameKey="ou" />
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
              display: 'grid', gridTemplateColumns: '44px 1fr auto', alignItems: 'center', gap: 6,
              padding: '5px 8px', background: '#F2EAD3', borderRadius: 0,
              border: '1.5px solid #0E1B2C',
            }}>
              <span className="label" style={{ fontSize: 10, color: '#0E1B2C', letterSpacing: '0.14em' }}>{t.a}</span>
              <span className="serif" style={{ fontSize: 11, color: '#4A5466' }}>{t.l}</span>
              {editable ? (
                <div style={{ display: 'flex', gap: 0, border: '1.5px solid #0E1B2C' }}>
                  <button
                    type="button"
                    onClick={() => setPick(t.a, isOver ? '' : 'over')}
                    style={{
                      background: isOver ? '#4F6B3F' : '#F2EAD3',
                      color: isOver ? '#F2EAD3' : '#4A5466',
                      border: 'none', borderRadius: 0, padding: '2px 8px',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                    aria-label={`${t.a} over`}
                  >▲</button>
                  <button
                    type="button"
                    onClick={() => setPick(t.a, isUnder ? '' : 'under')}
                    style={{
                      background: isUnder ? '#1E4A6B' : '#F2EAD3',
                      color: isUnder ? '#F2EAD3' : '#4A5466',
                      border: 'none', borderLeft: '1.5px solid #0E1B2C', borderRadius: 0, padding: '2px 8px',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                    aria-label={`${t.a} under`}
                  >▼</button>
                </div>
              ) : (
                <span className="mono" style={{
                  fontSize: 11, fontWeight: 700,
                  color: isOver ? '#4F6B3F' : isUnder ? '#1E4A6B' : '#4A5466',
                  background: 'transparent',
                  border: `1.5px solid ${isOver ? '#4F6B3F' : isUnder ? '#1E4A6B' : 'transparent'}`,
                  borderRadius: 0, padding: '1px 6px',
                }}>
                  {isOver ? '▲ Over' : isUnder ? '▼ Under' : '—'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
