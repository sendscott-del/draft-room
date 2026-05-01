import { useMemo } from 'react'
import type { PSPicks, UserAppData } from '../../types'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'
import { COLORS, TEAMS } from '../../data/constants'
import { derivePSOutcomes, hasEnoughOdds, scorePSAgainstOutcomes, type PlayoffOddsMap } from '../../lib/psProjection'
import { SectionHeader, DidNotPlay, sortPlayersForGame, PlayerColumns, type PlayerView } from './shared'

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

export default function Postseason({ players, onEditMine }: Props) {
  const locked = isLocked('ps')

  // FG playoff probabilities are replicated to every picks blob by the daily
  // update-stats job. Pull the first one we find and build the projected
  // outcomes map (which team wins each division, WC, pennant, WS).
  const outcomes = useMemo(() => {
    for (const p of players) {
      const odds = (p.picks as UserAppData & { playoffOdds?: PlayoffOddsMap })?.playoffOdds
      if (hasEnoughOdds(odds)) return derivePSOutcomes(odds!)
    }
    return null
  }, [players])

  const playing = sortPlayersForGame(
    players.filter(p => playedPS(p) || p.isCurrentUser)
      .map(p => {
        const proj = outcomes ? scorePSAgainstOutcomes(p.picks.ps, outcomes) : 0
        return { ...p, score: proj }
      })
  )
  const skipped = players.filter(p => !p.isCurrentUser && !playedPS(p))

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started — postseason picks are locked.'} />}
      <Pills items={['Div +5 each', 'WC +3 each (any slot)', 'Pennant +10 each', 'WS +25']} />

      <PlayerColumns>
        {playing.map(p => (
          <PlayerPSSection
            key={p.profile.id}
            player={p}
            outcomes={outcomes}
            editable={p.isCurrentUser && !locked}
            onEdit={p.isCurrentUser ? onEditMine : undefined}
          />
        ))}
      </PlayerColumns>

      <DidNotPlay names={skipped.map(s => s.profile.display_name)} game="Postseason" />
    </>
  )
}

function PlayerPSSection({
  player, outcomes, editable, onEdit,
}: {
  player: PlayerView & { score: number }
  outcomes: ReturnType<typeof derivePSOutcomes> | null
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

  const score = outcomes ? `~${player.score}` : '—'
  const unit = outcomes ? 'pts' : undefined

  // For each pick, decide whether it currently matches the projected
  // outcome. Drives the green check / red x next to the row.
  function picksDivision(k: keyof NonNullable<PSPicks['divisions']>): boolean | null {
    if (!outcomes || !ps.divisions?.[k]) return null
    return ps.divisions[k] === outcomes.divisions[k]
  }
  function picksWC(lg: 'al' | 'nl', i: number): boolean | null {
    if (!outcomes) return null
    const team = ps.wildCards?.[lg]?.[i]
    if (!team) return null
    return outcomes.wildCards[lg].includes(team)
  }
  function picksPennant(lg: 'al' | 'nl'): boolean | null {
    if (!outcomes || !ps.pennants?.[lg]) return null
    return ps.pennants[lg] === outcomes.pennants[lg]
  }
  function picksWS(): boolean | null {
    if (!outcomes || !ps.ws) return null
    return ps.ws === outcomes.ws
  }

  return (
    <div style={{ scrollSnapAlign: 'start' }}>
      <SectionHeader player={player} score={score} unit={unit} color={PS_COLOR} editable={editable} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        {DIVISIONS.map(d => (
          <PSRow key={d.key} label={d.label} value={ps.divisions?.[d.key]} hit={picksDivision(d.key)} editable={editable} onChange={v => setDivision(d.key, v)} />
        ))}
        {(['al', 'nl'] as const).map(lg => (
          [0, 1, 2].map(i => (
            <PSRow
              key={`${lg}wc${i}`}
              label={`${lg.toUpperCase()} WC #${i + 1}`}
              value={ps.wildCards?.[lg]?.[i]}
              hit={picksWC(lg, i)}
              editable={editable}
              onChange={v => setWC(lg, i, v)}
            />
          ))
        ))}
        <PSRow label="AL Pennant" value={ps.pennants?.al} hit={picksPennant('al')} editable={editable} onChange={v => setPennant('al', v)} />
        <PSRow label="NL Pennant" value={ps.pennants?.nl} hit={picksPennant('nl')} editable={editable} onChange={v => setPennant('nl', v)} />
        <PSRow label="World Series" value={ps.ws} hit={picksWS()} editable={editable} onChange={setWS} emphasize />
      </div>
    </div>
  )
}

function PSRow({ label, value, hit, editable, onChange, emphasize }: {
  label: string
  value: string | undefined
  /** null = no projection yet, true = pick matches projection, false = miss */
  hit: boolean | null
  editable: boolean
  onChange: (v: string) => void
  emphasize?: boolean
}) {
  const hitMark = hit === true ? '✓' : hit === false ? '·' : ''
  const hitColor = hit === true ? '#5eb774' : hit === false ? COLORS.muted : 'transparent'
  return (
    <Card style={{ padding: '6px 10px', minHeight: 38, boxSizing: 'border-box', display: 'flex', alignItems: 'center', ...(emphasize ? { borderLeft: `3px solid ${PS_COLOR}` } : {}) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 14px', alignItems: 'center', gap: 6, width: '100%' }}>
        <span style={{ fontSize: 11, color: COLORS.muted2, fontWeight: 700 }}>{label}</span>
        {editable ? (
          <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ background: '#1e293b', border: `1px solid ${COLORS.border}`, borderRadius: 5, color: COLORS.text, padding: '3px 8px', fontSize: 12, outline: 'none', height: 26, boxSizing: 'border-box' }}>
            <option value="">—</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: value ? COLORS.text : COLORS.muted, textAlign: 'left', height: 26, lineHeight: '26px' }}>
            {value || '—'}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 900, color: hitColor, textAlign: 'center', fontFamily: 'monospace' }}>{hitMark}</span>
      </div>
    </Card>
  )
}
