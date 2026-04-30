import type { TDPickPersonal } from '../../types'
import { scoreTD } from '../../lib/scoring-per-user'
import Card from '../ui/Card'
import { Pills } from '../ui/Pill'
import { COLORS, TEAMS } from '../../data/constants'
import { SectionHeader, DidNotPlay, sortPlayersForGame, inputStyle, PlayerColumns, type PlayerView, type EditMine } from './shared'

const TD_COLOR = '#f0a531'

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedTD = (p: PlayerView) => (p.picks?.td ?? []).length > 0

export default function TradeDeadline({ players, onEditMine }: Props) {
  const playing = sortPlayersForGame(
    players.filter(p => playedTD(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: scoreTD(p.picks.td ?? []) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedTD(p))

  return (
    <>
      <Pills items={['Mid-season picks', 'Correct team +10', 'Was traded +5']} />
      <PlayerColumns>
        {playing.map(p => (
          <PlayerTDSection
            key={p.profile.id}
            player={p}
            editable={p.isCurrentUser}
            onEdit={p.isCurrentUser ? onEditMine : undefined}
          />
        ))}
      </PlayerColumns>
      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Trade Deadline" />
    </>
  )
}

function PlayerTDSection({ player, editable, onEdit }: {
  player: PlayerView & { score: number }
  editable: boolean
  onEdit?: EditMine
}) {
  const picks: TDPickPersonal[] = (player.picks.td ?? []) as TDPickPersonal[]

  function setField(idx: number, field: keyof TDPickPersonal, value: string | boolean) {
    if (!onEdit) return
    onEdit(mine => {
      const td = [...(mine.td ?? [])]
      td[idx] = { ...td[idx], [field]: value } as TDPickPersonal
      return { ...mine, td }
    })
  }

  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={player.score} unit="pts" color={TD_COLOR} editable={editable} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {[...picks].sort((a, b) => a.round - b.round).map((pick, i) => (
          <Card key={pick.round} style={{ padding: '7px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ background: 'rgba(240,165,49,0.12)', color: TD_COLOR, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>R{pick.round}</span>
              {editable ? (
                <input value={pick.player} placeholder="Player" onChange={e => setField(i, 'player', e.target.value)} style={inputStyle} />
              ) : (
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>
                  {pick.player || <span style={{ color: COLORS.muted }}>—</span>}
                </span>
              )}
              {editable ? (
                <select value={pick.team || ''} onChange={e => setField(i, 'team', e.target.value)} style={{ ...inputStyle, width: 80 }}>
                  <option value="">—</option>
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: 11, color: COLORS.muted2, fontFamily: 'monospace' }}>{pick.team || '—'}</span>
              )}
            </div>
          </Card>
        ))}
        {picks.length === 0 && editable && (
          <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', padding: '8px 10px' }}>
            No picks yet — Trade Deadline picks are made mid-season.
          </div>
        )}
      </div>
    </div>
  )
}
