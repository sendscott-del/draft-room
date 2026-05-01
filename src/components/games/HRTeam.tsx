import type { HRSlot } from '../../types'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { POS, COLORS } from '../../data/constants'
import { scoreHR } from '../../lib/scoring-per-user'
import { SectionHeader, DidNotPlay, sortPlayersForGame, inputStyle, PlayerColumns, type PlayerView, type EditMine } from './shared'

const HR_COLOR = '#e45b5b'

interface Props {
  players: PlayerView[]
  onEditMine: EditMine
}

const playedHR = (p: PlayerView) =>
  Object.values(p.picks?.hr ?? {}).some(s => s?.p)

export default function HRTeam({ players, onEditMine }: Props) {
  const locked = isLocked('hr')
  const playing = sortPlayersForGame(
    players.filter(p => playedHR(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: scoreHR(p.picks.hr ?? {}) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedHR(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Draft complete — HR Team picks are locked.'} />}
      <Pills items={['One player per position', 'Points = total HRs']} />

      <PlayerColumns>
        {playing.map(p => (
          <PlayerHRSection
            key={p.profile.id}
            player={p}
            editable={p.isCurrentUser && !locked}
            onEdit={p.isCurrentUser ? onEditMine : undefined}
          />
        ))}
      </PlayerColumns>

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="HR Team" />
    </>
  )
}

function PlayerHRSection({
  player, editable, onEdit,
}: {
  player: PlayerView & { score: number }
  editable: boolean
  onEdit?: EditMine
}) {
  const slots = (player.picks.hr ?? {}) as Record<string, HRSlot>

  function setSlot(pos: string, field: keyof HRSlot, value: string | number) {
    if (!onEdit) return
    onEdit(mine => ({
      ...mine,
      hr: { ...(mine.hr ?? {}), [pos]: { ...(mine.hr?.[pos] ?? { p: '', t: '', hr: 0 }), [field]: value } },
    }))
  }

  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={player.score} unit="HR" color={HR_COLOR} editable={editable} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {POS.map(pos => {
          const slot = slots[pos] ?? { p: '', t: '', hr: 0 }
          const hrs = Number(slot.hr) || 0
          return (
            <Card key={pos} style={{ padding: '8px 10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 6, rowGap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: HR_COLOR }}>{pos}</span>
                {editable ? (
                  <input value={slot.p} placeholder="Player" onChange={e => setSlot(pos, 'p', e.target.value)} style={inputStyle} />
                ) : (
                  <span style={{ fontSize: 12, color: slot.p ? COLORS.text : COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.p || '—'}</span>
                )}
                <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'monospace', textAlign: 'right', color: hrs > 0 ? HR_COLOR : COLORS.muted, minWidth: 36 }}>
                  {hrs > 0 ? `${hrs}HR` : '—'}
                </span>
                <span style={{ gridColumn: '2 / 4', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {editable ? (
                    <input value={slot.t} placeholder="TEAM" onChange={e => setSlot(pos, 't', e.target.value.toUpperCase())} style={{ ...inputStyle, width: 70, textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }} />
                  ) : (
                    <span style={{ fontSize: 11, color: COLORS.muted2, fontFamily: 'monospace' }}>{slot.t || '—'}</span>
                  )}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
