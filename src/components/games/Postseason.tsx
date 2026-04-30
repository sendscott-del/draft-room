import type { PSPicks } from '../../types'
import { TEAMS, COLORS } from '../../data/constants'
import { isLocked } from '../../lib/locks'
import Card from '../ui/Card'
import LockBanner from '../ui/LockBanner'
import { Pills } from '../ui/Pill'

interface Props {
  myPicks: PSPicks
  comparePicks: PSPicks | undefined
  compareName: string | null
  onChange: (next: PSPicks) => void
}

const PS_COLOR = '#fbbf24'

const DIVISIONS: Array<{ key: keyof NonNullable<PSPicks['divisions']>; label: string }> = [
  { key: 'alEast',    label: 'AL East' },
  { key: 'alCentral', label: 'AL Central' },
  { key: 'alWest',    label: 'AL West' },
  { key: 'nlEast',    label: 'NL East' },
  { key: 'nlCentral', label: 'NL Central' },
  { key: 'nlWest',    label: 'NL West' },
]

export default function Postseason({ myPicks, comparePicks, compareName, onChange }: Props) {
  const locked = isLocked('ps')

  function setDivision(k: keyof NonNullable<PSPicks['divisions']>, v: string) {
    onChange({
      ...myPicks,
      divisions: { ...(myPicks.divisions ?? {}), [k]: v },
    })
  }
  function setWC(lg: 'al' | 'nl', idx: number, v: string) {
    const cur = (myPicks.wildCards?.[lg] ?? ['', '', '']).slice()
    cur[idx] = v
    onChange({
      ...myPicks,
      wildCards: { ...(myPicks.wildCards ?? {}), [lg]: cur },
    })
  }
  function setPennant(lg: 'al' | 'nl', v: string) {
    onChange({
      ...myPicks,
      pennants: { ...(myPicks.pennants ?? {}), [lg]: v },
    })
  }
  function setWS(v: string) {
    onChange({ ...myPicks, ws: v })
  }

  const compareLabel = compareName ?? 'Compare'
  const myDiv = myPicks.divisions ?? {}
  const cDiv = comparePicks?.divisions ?? {}

  return (
    <>
      {locked && <LockBanner message={'\u{1F512} Season has started — postseason picks are locked.'} />}
      <Pills items={['6 division winners', '3 wild cards per league', 'Pennants + World Series']} />

      <SectionHeader label="Division Winners" />
      {DIVISIONS.map(({ key, label }) => (
        <PickRow
          key={key}
          label={label}
          mine={myDiv[key]}
          theirs={cDiv[key]}
          compareLabel={compareLabel}
          locked={locked}
          onMineChange={v => setDivision(key, v)}
        />
      ))}

      <SectionHeader label="Wild Cards" />
      {(['al', 'nl'] as const).map(lg => {
        const myWC = myPicks.wildCards?.[lg] ?? []
        const cWC = comparePicks?.wildCards?.[lg] ?? []
        return (
          <div key={lg} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.muted2, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
              {lg.toUpperCase()} Wild Cards
            </div>
            {[0, 1, 2].map(i => (
              <PickRow
                key={i}
                label={`#${i + 1}`}
                mine={myWC[i]}
                theirs={cWC[i]}
                compareLabel={compareLabel}
                locked={locked}
                onMineChange={v => setWC(lg, i, v)}
              />
            ))}
          </div>
        )
      })}

      <SectionHeader label="League Pennants" />
      <PickRow
        label="AL Pennant"
        mine={myPicks.pennants?.al}
        theirs={comparePicks?.pennants?.al}
        compareLabel={compareLabel}
        locked={locked}
        onMineChange={v => setPennant('al', v)}
      />
      <PickRow
        label="NL Pennant"
        mine={myPicks.pennants?.nl}
        theirs={comparePicks?.pennants?.nl}
        compareLabel={compareLabel}
        locked={locked}
        onMineChange={v => setPennant('nl', v)}
      />

      <SectionHeader label="World Series" />
      <PickRow
        label={'\u{1F3C6} WS Champion'}
        mine={myPicks.ws}
        theirs={comparePicks?.ws}
        compareLabel={compareLabel}
        locked={locked}
        onMineChange={setWS}
        emphasize
      />
    </>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.muted, marginBottom: 6, marginTop: 18, paddingBottom: 4, borderBottom: `1px solid ${COLORS.border}` }}>
      {label}
    </div>
  )
}

function PickRow({
  label, mine, theirs, compareLabel, locked, onMineChange, emphasize,
}: {
  label: string
  mine: string | undefined
  theirs: string | undefined
  compareLabel: string
  locked: boolean
  onMineChange: (v: string) => void
  emphasize?: boolean
}) {
  const match = !!mine && !!theirs && mine === theirs
  return (
    <Card
      style={{ padding: '8px 12px', marginBottom: 6, ...(emphasize ? { borderLeft: `4px solid ${PS_COLOR}` } : {}) }}
      borderColor={match ? `${PS_COLOR}66` : undefined}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12, color: COLORS.muted2, fontWeight: 700 }}>{label}</div>
        <div>
          <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1, marginBottom: 2 }}>YOU</div>
          <select
            value={mine ?? ''}
            onChange={e => onMineChange(e.target.value)}
            disabled={locked}
            style={{
              background: '#1e293b', border: `1px solid ${COLORS.border}`,
              borderRadius: 5, color: COLORS.text, padding: '4px 8px', fontSize: 13,
              outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
              opacity: locked ? 0.6 : 1,
            }}
          >
            <option value="">—</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1, marginBottom: 2 }}>{compareLabel.toUpperCase()}</div>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`,
            borderRadius: 5, padding: '4px 8px', fontSize: 13,
            color: theirs ? COLORS.text : COLORS.muted,
            textAlign: 'center', fontFamily: 'monospace', fontWeight: 700,
          }}>
            {theirs || '—'}
          </div>
        </div>
      </div>
    </Card>
  )
}
