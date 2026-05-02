import type { UserAppData, PlayerProfile } from '../../types'

export interface PlayerView {
  profile: PlayerProfile
  picks: UserAppData
  isCurrentUser: boolean
}

/** Shared input style — cream paper, navy ink, hard 1.5px border. */
export const inputStyle: React.CSSProperties = {
  background: '#F2EAD3',
  border: '1.5px solid #0E1B2C',
  borderRadius: 0,
  color: '#0E1B2C',
  padding: '4px 7px',
  fontFamily: "'Roboto Slab', serif",
  fontSize: 12,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

/** Per-player section header — Studio Talk lower-third with the player's
 *  name in Oswald, a YOU / SHOW badge, an optional editable tag, and a
 *  big monospace score in the game's accent color. */
export function SectionHeader({
  player, score, unit, color, editable, suffix,
}: {
  player: PlayerView
  score: number | string
  unit?: string
  color: string
  editable: boolean
  suffix?: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#0E1B2C',
        color: '#F2EAD3',
        padding: '10px 14px',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        borderLeft: `5px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 42,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          left: 'auto',
          width: 60,
          background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(212,162,76,0.18) 6px 12px)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#F2EAD3',
            whiteSpace: 'nowrap',
          }}
        >
          {player.profile.display_name}
        </span>
        {player.isCurrentUser && (
          <span
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#F2EAD3',
              background: '#C8332C',
              border: '1.5px solid #F2EAD3',
              padding: '2px 6px',
              textTransform: 'uppercase',
            }}
          >
            You
          </span>
        )}
        {player.profile.is_show_account && (
          <span
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#0E1B2C',
              background: '#D4A24C',
              border: '1.5px solid #F2EAD3',
              padding: '2px 6px',
              textTransform: 'uppercase',
            }}
          >
            Show
          </span>
        )}
        {editable && (
          <span
            className="script-italic"
            style={{ fontSize: 11, color: 'rgba(242,234,211,0.75)' }}
          >
            (editable)
          </span>
        )}
        {suffix}
      </div>
      <div
        className="brand-display"
        style={{
          fontSize: 22,
          color,
          letterSpacing: '0.02em',
          position: 'relative',
        }}
      >
        {score}
        {unit ? (
          <span
            className="label"
            style={{ fontSize: 10, marginLeft: 4, color: 'rgba(242,234,211,0.7)', letterSpacing: '0.18em' }}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** "Did Not Play" footnote — dashed border, italic note in muted ink. */
export function DidNotPlay({ names, game }: { names: string[]; game: string }) {
  if (names.length === 0) return null
  return (
    <div
      className="serif"
      style={{
        marginTop: 18,
        padding: '8px 12px',
        background: '#F2EAD3',
        border: '1.5px dashed #4A5466',
        fontSize: 12,
        color: '#4A5466',
        fontStyle: 'italic',
      }}
    >
      Did not play {game}: {names.join(', ')}
    </div>
  )
}

export function sortPlayersForGame<T extends PlayerView & { score: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.score - a.score)
}

export type EditMine = (fn: (mine: UserAppData) => UserAppData) => void

/** Horizontal-scrolling grid of player columns. Each column is at least
 *  240 px wide so text + scores stay legible on a phone. */
export function PlayerColumns({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(260px, 1fr)',
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 8,
        marginTop: 10,
        scrollSnapType: 'x proximity',
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} style={{ minWidth: 0, overflow: 'hidden' }}>{child}</div>
          ))
        : <div style={{ minWidth: 0, overflow: 'hidden' }}>{children}</div>}
    </div>
  )
}
