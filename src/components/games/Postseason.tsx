import type { PSPicks } from '../../types'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS, TEAMS } from '../../data/constants'
import { SectionHeader, DidNotPlay, sortPlayersForGame, type PlayerView } from './shared'

const PS_COLOR = '#e8b54a'

interface Props {
  players: PlayerView[]
  onEditMine: (next: PSPicks) => void
}

const playedPS = (p: PlayerView) => {
  const ps = p.picks?.ps
  if (!ps) return false
  return !!ps.ws || !!ps.divisions || !!ps.wildCards || !!ps.pennants
}

const DIVISIONS: Array<{ key: keyof NonNullable<PSPicks['divisions']>; label: string }> = [
  { key: 'alEast', label: 'AL East' }, { key: 'alCentral', label: 'AL Central' }, { key: 'alWest', label: 'AL West' },
  { key: 'nlEast', label: 'NL East' }, { key: 'nlCentral', label: 'NL Central' }, { key: 'nlWest', label: 'NL West' },
]

function psFilledCount(ps: PSPicks | undefined): number {
  if (!ps) return 0
  let n = 0
  if (ps.ws) n++
  if (ps.pennants?.al) n++
  if (ps.pennants?.nl) n++
  for (const d of DIVISIONS) if (ps.divisions?.[d.key]) n++
  for (const t of ps.wildCards?.al ?? []) if (t) n++
  for (const t of ps.wildCards?.nl ?? []) if (t) n++
  return n
}

export default function Postseason({ players, onEditMine }: Props) {
  const locked = isLocked('ps')
  const playing = sortPlayersForGame(
    players.filter(p => playedPS(p) || p.isCurrentUser)
      .map(p => ({ ...p, score: psFilledCount(p.picks.ps) }))
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedPS(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started — postseason picks are locked.'} />}
      <Pills items={['6 division winners', '3 wild cards / league', 'Pennants + World Series']} />

      {playing.map(p => (
        <PlayerPSSection
          key={p.profile.id}
          player={p}
          editable={p.isCurrentUser && !locked}
          onEdit={p.isCurrentUser ? onEditMine : undefined}
        />
      ))}

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Postseason" />
    </>
  )
}

function PlayerPSSection({
  player, editable, onEdit,
}: {
  player: PlayerView & { score: number }
  editable: boolean
  onEdit?: (next: PSPicks) => void
}) {
  const ps: PSPicks = player.picks.ps ?? {}

  function setDivision(k: keyof NonNullable<PSPicks['divisions']>, v: string) {
    if (!onEdit) return
    onEdit({ ...ps, divisions: { ...(ps.divisions ?? {}), [k]: v } })
  }
  function setWC(lg: 'al' | 'nl', i: number, v: string) {
    if (!onEdit) return
    const cur = (ps.wildCards?.[lg] ?? ['', '', '']).slice()
    cur[i] = v
    onEdit({ ...ps, wildCards: { ...(ps.wildCards ?? {}), [lg]: cur } })
  }
  function setPennant(lg: 'al' | 'nl', v: string) {
    if (!onEdit) return
    onEdit({ ...ps, pennants: { ...(ps.pennants ?? {}), [lg]: v } })
  }
  function setWS(v: string) {
    if (!onEdit) return
    onEdit({ ...ps, ws: v })
  }

  return (
    <div style={{ marginTop: 12 }}>
      <SectionHeader player={player} score={player.score} unit="picks" color={PS_COLOR} editable={editable} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {DIVISIONS.map(d => (
          <PSRow key={d.key} label={d.label} value={ps.divisions?.[d.key]} editable={editable} onChange={v => setDivision(d.key, v)} />
        ))}
        {(['al', 'nl'] as const).map(lg => (
          [0, 1, 2].map(i => (
            <PSRow
              key={`${lg}wc${i}`}
              label={`${lg.toUpperCase()} WC #${i + 1}`}
              value={ps.wildCards?.[lg]?.[i]}
              editable={editable}
              onChange={v => setWC(lg, i, v)}
            />
          ))
        ))}
        <PSRow label="AL Pennant" value={ps.pennants?.al} editable={editable} onChange={v => setPennant('al', v)} />
        <PSRow label="NL Pennant" value={ps.pennants?.nl} editable={editable} onChange={v => setPennant('nl', v)} />
        <PSRow label="World Series" value={ps.ws} editable={editable} onChange={setWS} emphasize />
      </div>
    </div>
  )
}

function PSRow({ label, value, editable, onChange, emphasize }: {
  label: string
  value: string | undefined
  editable: boolean
  onChange: (v: string) => void
  emphasize?: boolean
}) {
  return (
    <Card style={{ padding: '6px 10px', ...(emphasize ? { borderLeft: `3px solid ${PS_COLOR}` } : {}) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: COLORS.muted2, fontWeight: 700 }}>{label}</span>
        {editable ? (
          <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ background: '#1e293b', border: `1px solid ${COLORS.border}`, borderRadius: 5, color: COLORS.text, padding: '3px 8px', fontSize: 12, outline: 'none' }}>
            <option value="">—</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: value ? COLORS.text : COLORS.muted, textAlign: 'left' }}>
            {value || '—'}
          </span>
        )}
      </div>
    </Card>
  )
}
